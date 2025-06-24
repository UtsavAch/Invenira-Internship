const { MoleculerError } = require("moleculer").Errors;
const Sequelize = require("sequelize");
const DbService = require("moleculer-db");
const SqlAdapter = require("moleculer-db-adapter-sequelize");

module.exports = {
	name: "iap",
	mixins: [DbService],
	adapter: new SqlAdapter(
		"postgres://uutsavacharya15@localhost:5432/inveniraBD?schema=invenirabd",
		{
			schema: "invenirabd",
			logging: false,
			searchPath: "invenirabd",
			freezeTableName: true,
			define: {
				timestamps: false,
			},
			dialectOptions: {
				prependSearchPath: true,
			},
		}
	),

	model: {
		name: "iaps",
		schema: "invenirabd",
		timestamps: false,
		define: {
			name: Sequelize.STRING,
			properties: Sequelize.JSON,
			nodes: Sequelize.JSON,
			edges: Sequelize.JSON,
			is_deployed: Sequelize.BOOLEAN,
		},
	},

	actions: {
		async create(ctx) {
			try {
				const { name, properties, nodes, edges, user_id } = ctx.params;

				const iap = await this.adapter.model.create({
					name,
					properties: properties || {},
					nodes: nodes || [],
					edges: edges || [],
				});

				if (edges && edges.length) {
					await ctx.call("activity_connections.create", {
						iap_id: iap.id,
						edges,
					});
				}

				await this.adapter.db.query(
					`INSERT INTO invenirabd.iap_ownership 
                     (users_id, iap_id, is_owner) 
                     VALUES (${user_id}, ${iap.id}, TRUE)`
				);

				return iap;
			} catch (error) {
				throw new MoleculerError(
					`Failed to create IAP: ${error.message}`,
					500
				);
			}
		},

		async get(ctx) {
			try {
				const iap = await this.adapter.model.findOne({
					where: { id: ctx.params.id },
				});
				if (!iap) throw new MoleculerError("IAP not found", 404);
				return iap;
			} catch (error) {
				throw new MoleculerError(
					`Failed to get IAP: ${error.message}`,
					500
				);
			}
		},

		async list(ctx) {
			try {
				const { all, name, user_id } = ctx.params;

				if (all) {
					return await this.adapter.model.findAll();
				}

				if (user_id) {
					const [results] = await this.adapter.db.query(
						`SELECT i.* FROM invenirabd.iaps i
                         JOIN invenirabd.iap_ownership io ON i.id = io.iap_id
                         WHERE io.users_id = ${user_id} AND io.is_owner = TRUE`
					);
					return results || [];
				}

				return await this.adapter.model.findAll({
					where: name
						? {
								name: {
									[Sequelize.Op.iLike]: `%${name}%`,
								},
						  }
						: {},
				});
			} catch (error) {
				throw new MoleculerError(
					`Failed to list IAPs: ${error.message}`,
					500
				);
			}
		},

		async update(ctx) {
			try {
				const { id, user_id, ...updateData } = ctx.params;

				const [ownership] = await this.adapter.db.query(
					`SELECT 1 FROM invenirabd.iap_ownership
				 WHERE users_id = ${user_id} AND iap_id = ${id} AND is_owner = TRUE`
				);
				if (!ownership.length) {
					throw new MoleculerError(
						"Unauthorized: Not the IAP owner",
						403
					);
				}

				// Use updateData.edges and updateData.nodes for validation
				if (updateData.edges) {
					const nodeIds = updateData.nodes
						? updateData.nodes.map((n) => n.id)
						: [];
					const invalidEdges = updateData.edges.filter(
						(edge) =>
							!nodeIds.includes(edge.source) ||
							!nodeIds.includes(edge.target)
					);

					if (invalidEdges.length > 0) {
						throw new MoleculerError(
							"Edges reference non-existent nodes",
							400
						);
					}

					// Update activity_connections
					await ctx.call("activity_connections.deleteByIap", {
						iap_id: id,
					});
					if (updateData.edges.length) {
						await ctx.call("activity_connections.create", {
							iap_id: id,
							edges: updateData.edges,
						});
					}
				}

				const iap = await this.adapter.model.findOne({ where: { id } });
				if (!iap) throw new MoleculerError("IAP not found", 404);
				await iap.update(updateData);
				return iap;
			} catch (error) {
				throw new MoleculerError(
					`Failed to update IAP: ${error.message}`,
					500
				);
			}
		},

		async remove(ctx) {
			try {
				const { id, user_id } = ctx.params;

				// Ownership check
				const [ownership] = await this.adapter.db.query(
					`SELECT 1 FROM invenirabd.iap_ownership
					 WHERE users_id = ${user_id} AND iap_id = ${id} AND is_owner = TRUE`
				);
				if (!ownership.length) {
					throw new MoleculerError(
						"Unauthorized: Not the IAP owner",
						403
					);
				}

				// Delete objectives and their analytics
				await this.adapter.db.query(`
					DELETE FROM invenirabd.objective_analytics 
					WHERE objective_id IN (
						SELECT id FROM invenirabd.objective 
						WHERE iap_id = ${id}
					)
				`);
				await this.adapter.db.query(`
					DELETE FROM invenirabd.objective 
					WHERE iap_id = ${id}
				`);

				const [deployedIaps] = await this.adapter.db.query(`
					SELECT id FROM invenirabd.deployed_iaps
					WHERE iap_id = ${id}
				  `);

				for (const deployedIap of deployedIaps) {
					await ctx.call("scores.deleteByDeployedIapId", {
						deployed_iap_id: deployedIap.id,
					});
				}

				// Delete related deployed IAPs
				await ctx.call("deployed_iaps.deleteByIapId", {
					iap_id: id,
					user_id,
				});

				// Delete activity connections and ownership
				await ctx.call("activity_connections.deleteByIap", {
					iap_id: id,
				});
				await this.adapter.db.query(
					`DELETE FROM invenirabd.iap_ownership WHERE iap_id = ${id}`
				);

				// Finally, delete the IAP
				await this.adapter.model.destroy({ where: { id } });

				return { message: "IAP deleted successfully" };
			} catch (error) {
				throw new MoleculerError(
					`Failed to delete IAP: ${error.message}`,
					500
				);
			}
		},

		async getAnalytics(ctx) {
			try {
				const iap = await this.adapter.model.findOne({
					where: { id: ctx.params.id },
				});
				if (!iap) throw new MoleculerError("IAP not found", 404);

				const nodes = iap.nodes || [];
				const activityIds = nodes
					.map((node) => node.id)
					.filter((id) => id);

				if (activityIds.length === 0) return [];

				const [analytics] = await this.adapter.db.query(`
					SELECT a.id, a.name, a.activity_id, a.score 
					FROM invenirabd.analytics a
					WHERE activity_id IN (${activityIds.join(",")})
				  `);
				return analytics;
			} catch (error) {
				throw new MoleculerError(
					`Failed to get analytics: ${error.message}`,
					500
				);
			}
		},

		async deploy(ctx) {
			const { id, deployURL, objectives, user_id, activityUrls } =
				ctx.params;

			// Validate inputs
			if (
				!deployURL ||
				!objectives ||
				objectives.length === 0 ||
				!activityUrls
			) {
				throw new MoleculerError("Missing required fields", 400);
			}

			// Check ownership
			const [ownership] = await this.adapter.db.query(`
				SELECT 1 FROM invenirabd.iap_ownership
				WHERE users_id = ${user_id} AND iap_id = ${id} AND is_owner = TRUE
			`);
			if (!ownership.length) {
				throw new MoleculerError("Unauthorized", 403);
			}

			// Get IAP and activities
			const iap = await this.adapter.model.findOne({ where: { id } });
			if (!iap) throw new MoleculerError("IAP not found", 404);

			// Validate activity URLs
			const nodes = iap.nodes || [];
			//const missingUrls =
			nodes.filter(
				(node) =>
					!(activityUrls[node.id] && activityUrls[node.id].trim()) ||
					!Number.isInteger(node.id)
			);

			// Create deployed_iaps entry
			const [deployedIap] = await this.adapter.db.query(`
				INSERT INTO invenirabd.deployed_iaps 
				(iap_id, name, properties, nodes, edges, objectives, deploy_url)
				VALUES (
					${id},
					'${iap.name.replace(/'/g, "''")}',
					'${JSON.stringify(iap.properties)}',
					'${JSON.stringify(nodes)}',
					'${JSON.stringify(iap.edges)}',
					'${JSON.stringify(objectives)}',
					'${deployURL.replace(/'/g, "''")}'
				)
				RETURNING *
			`);

			// Create iap_activities entries
			for (const node of nodes) {
				await this.adapter.db.query(`
					INSERT INTO invenirabd.iap_activities 
					(iap_id, activity_id, act_name, deployment_url)
					VALUES (
						${deployedIap[0].id},
						${node.id},
						'${node.name.replace(/'/g, "''")}',
						'${""}'
					)
				`);
			}

			// Create objectives and link analytics
			const [analytics] = await this.adapter.db.query(`
				SELECT id, activity_id 
				FROM invenirabd.analytics
				WHERE activity_id IN (${nodes.map((n) => n.id).join(",")})
			`);

			for (const obj of objectives) {
				// Insert objective
				const [objectiveRows] = await this.adapter.db.query(`
					INSERT INTO invenirabd.objective (iap_id, name)
					VALUES (${id}, '${obj.name.replace(/'/g, "''")}')
					RETURNING id
				`);
				if (!objectiveRows || !objectiveRows[0]) {
					throw new MoleculerError("Failed to create objective", 500);
				}
				const objectiveId = objectiveRows[0].id;

				// Link to analytic
				const analyticId = parseInt(obj.analytic_id, 10);
				const analytic = analytics.find((a) => a.id === analyticId);

				if (analytic) {
					await this.adapter.db.query(`
						INSERT INTO invenirabd.objective_analytics 
						(objective_id, analytics_id)
						VALUES (${objectiveId}, ${analytic.id})
					`);
				}
			}

			// Update IAP deployment status
			await iap.update({ is_deployed: true });

			return {
				...iap.get(),
				is_deployed: true,
				deployed_url: deployURL,
				activity_urls: activityUrls,
			};
		},
	},
};
