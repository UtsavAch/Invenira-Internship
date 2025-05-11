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
				// Correct destructuring to include edges and nodes in updateData
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
				// Update the IAP with all data, including edges and nodes
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

				await ctx.call("activity_connections.deleteByIap", {
					iap_id: id,
				});
				// await this.adapter.db.query(
				// 	`DELETE FROM invenirabd.deployed_iaps
				// 	 WHERE id IN (
				// 	   SELECT id FROM invenirabd.deployed_iaps
				// 	   WHERE name = (SELECT name FROM invenirabd.iaps WHERE id = ${id})
				// 	 )`
				// );
				await this.adapter.db.query(
					`DELETE FROM invenirabd.iap_ownership WHERE iap_id = ${id}`
				);
				await this.adapter.model.destroy({ where: { id } });

				return { message: "IAP deleted successfully" };
			} catch (error) {
				throw new MoleculerError(
					`Failed to delete IAP: ${error.message}`,
					500
				);
			}
		},
		// async remove(ctx) {
		// 	const iap = await this.adapter.model.findOne({
		// 		where: { id: ctx.params.id },
		// 	});
		// 	if (!iap) {
		// 		throw new MoleculerError("IAP not found", 404);
		// 	}
		// 	await iap.destroy();
		// 	return iap;
		// },

		async deployIap(ctx) {
			try {
				const { iap_id, user_id, deployURL } = ctx.params;

				// 1. Verify ownership
				const [ownership] = await this.adapter.db.query(
					`SELECT 1 FROM invenirabd.iap_ownership 
         WHERE users_id = ${user_id} 
         AND iap_id = ${iap_id} 
         AND is_owner = TRUE`
				);

				if (!ownership.length) {
					throw new MoleculerError(
						"Unauthorized: Not the IAP owner",
						403
					);
				}

				// 2. Get the IAP and check deployment status
				const iap = await this.adapter.model.findOne({
					where: { id: iap_id },
				});

				if (!iap) {
					throw new MoleculerError("IAP not found", 404);
				}

				// New: Check if already deployed
				if (iap.is_deployed) {
					throw new MoleculerError("IAP is already deployed", 400);
				}

				// 3. Create deployed_iaps entry
				const [deployedIap] = await this.adapter.db.query(
					`INSERT INTO invenirabd.deployed_iaps 
         (name, properties, nodes, edges, objectives, deploy_url)
         VALUES (?, ?, ?, ?, ?, ?)
         RETURNING *`,
					{
						replacements: [
							iap.name,
							JSON.stringify(iap.properties),
							JSON.stringify(iap.nodes),
							JSON.stringify(iap.edges),
							JSON.stringify({}), // Empty objectives
							deployURL,
						],
						type: Sequelize.QueryTypes.INSERT,
					}
				);

				// 4. Update original IAP's deployment status
				await this.adapter.model.update(
					{ is_deployed: true },
					{ where: { id: iap_id } }
				);

				return deployedIap;
			} catch (error) {
				throw new MoleculerError(
					`Deployment failed: ${error.message}`,
					500
				);
			}
		},

		async listDeployed(ctx) {
			try {
				const [results] = await this.adapter.db.query(
					"SELECT * FROM invenirabd.deployed_iaps"
				);
				return results;
			} catch (error) {
				throw new MoleculerError(
					`Failed to list deployed IAPs: ${error.message}`,
					500
				);
			}
		},
	},
};
