const { MoleculerError } = require("moleculer").Errors;
const Sequelize = require("sequelize");
const DbService = require("moleculer-db");
const SqlAdapter = require("moleculer-db-adapter-sequelize");

module.exports = {
	name: "deployed_iaps",
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
		name: "deployed_iaps",
		schema: "invenirabd",
		timestamps: false,
		define: {
			iap_id: Sequelize.INTEGER,
			name: Sequelize.STRING,
			properties: Sequelize.JSON,
			nodes: Sequelize.JSON,
			edges: Sequelize.JSON,
			objectives: Sequelize.JSON,
			deploy_url: Sequelize.STRING,
		},
	},

	actions: {
		//Get all deployed Iaps
		async getAllDeployedIaps(ctx) {
			const { user_id } = ctx.params;
			let query = `
			  SELECT di.*, 
				EXISTS (
				  SELECT 1 
				  FROM invenirabd.iap_ownership io 
				  WHERE io.users_id = ${user_id || "NULL"}
					AND io.iap_id = di.iap_id
				) AS is_added,
				EXISTS (
				  SELECT 1 
				  FROM invenirabd.iap_ownership io 
				  WHERE io.users_id = ${user_id || "NULL"}
					AND io.iap_id = di.iap_id
					AND io.is_owner = TRUE
				) AS is_owner
			  FROM invenirabd.deployed_iaps di
			`;

			const [results] = await this.adapter.db.query(query);
			return results;
		},

		//Delete deployed iap using iap id
		async deleteDeployedIap(ctx) {
			try {
				const { id, user_id } = ctx.params;

				// Get the deployed IAP to retrieve its original IAP ID
				const deployedIap = await this.adapter.model.findOne({
					where: { id },
				});
				if (!deployedIap) {
					throw new MoleculerError("Deployed IAP not found", 404);
				}

				// Ownership check for the original IAP
				const [ownership] = await this.adapter.db.query(`
					SELECT 1 FROM invenirabd.iap_ownership
					WHERE users_id = ${user_id} AND iap_id = ${deployedIap.iap_id} AND is_owner = TRUE
				`);
				if (!ownership.length) {
					throw new MoleculerError(
						"Unauthorized: Not the IAP owner",
						403
					);
				}

				// Delete iap_activities linked to this deployed IAP
				await this.adapter.db.query(
					`DELETE FROM invenirabd.iap_activities WHERE iap_id = ${id}`
				);

				// Delete the deployed IAP
				await this.adapter.model.destroy({ where: { id } });

				return { message: "Deployed IAP deleted successfully" };
			} catch (error) {
				throw new MoleculerError(
					`Failed to delete deployed IAP: ${error.message}`,
					500
				);
			}
		},

		async addToUser(ctx) {
			try {
				const { deployed_iap_id, user_id } = ctx.params;

				// Get the original iap_id and check ownership
				const [result] = await this.adapter.db.query(`
				SELECT di.iap_id, io.is_owner 
				FROM invenirabd.deployed_iaps di
				LEFT JOIN invenirabd.iap_ownership io 
				ON di.iap_id = io.iap_id 
				AND io.users_id = ${user_id}
				WHERE di.id = ${deployed_iap_id}
			`);

				if (!result.length) {
					throw new MoleculerError("Deployed IAP not found", 404);
				}

				const { iap_id, is_owner } = result[0];

				if (is_owner) {
					throw new MoleculerError(
						"User is already the owner of this IAP",
						400
					);
				}

				if (result[0].is_owner !== null) {
					throw new MoleculerError("IAP already added to user", 400);
				}

				await this.adapter.db.query(`
				INSERT INTO invenirabd.iap_ownership 
				(users_id, iap_id)
				VALUES (${user_id}, ${iap_id})
			`);

				return { success: true };
			} catch (error) {
				throw new MoleculerError(
					`Failed to add IAP to user: ${error.message}`,
					500
				);
			}
		},

		async getByUserId(ctx) {
			const { user_id } = ctx.params;
			const query = `
			  SELECT di.*, io.is_owner 
			  FROM invenirabd.deployed_iaps di
			  JOIN invenirabd.iap_ownership io ON di.iap_id = io.iap_id
			  WHERE io.users_id = ${user_id}
			`;
			const [results] = await this.adapter.db.query(query);
			return results;
		},

		async deleteByIapId(ctx) {
			try {
				const { iap_id, user_id } = ctx.params;

				// Verify ownership of the original IAP
				const [ownership] = await this.adapter.db.query(`
				SELECT 1 FROM invenirabd.iap_ownership
				WHERE users_id = ${user_id} AND iap_id = ${iap_id} AND is_owner = TRUE
			`);
				if (!ownership.length) {
					throw new MoleculerError(
						"Unauthorized: Not the IAP owner",
						403
					);
				}

				// Get all deployed IAPs for this original IAP
				const deployedIaps = await this.adapter.model.findAll({
					where: { iap_id },
					attributes: ["id"],
				});

				// Delete related iap_activities and deployed IAPs
				for (const deployedIap of deployedIaps) {
					await this.adapter.db.query(
						`DELETE FROM invenirabd.iap_activities WHERE iap_id = ${deployedIap.id}`
					);
				}

				// Delete the deployed IAPs
				await this.adapter.model.destroy({
					where: { iap_id },
				});

				return { message: "All deployed IAPs deleted successfully" };
			} catch (error) {
				throw new MoleculerError(
					`Failed to delete deployed IAPs: ${error.message}`,
					500
				);
			}
		},

		async getDeployedIap(ctx) {
			const { id } = ctx.params;
			const deployedIap = await this.adapter.model.findOne({
				where: { id },
			});
			if (!deployedIap) {
				throw new MoleculerError("Deployed IAP not found", 404);
			}
			return deployedIap;
		},

		async getObjectives(ctx) {
			const { id } = ctx.params;
			const deployedIap = await this.adapter.model.findOne({
				where: { id },
			});
			if (!deployedIap) {
				throw new MoleculerError("Deployed IAP not found", 404);
			}
			const query = `SELECT * FROM invenirabd.objective WHERE iap_id = ${deployedIap.iap_id}`;
			const [objectives] = await this.adapter.db.query(query);
			return objectives;
		},

		async getActivities(ctx) {
			const { id } = ctx.params;
			const query = `SELECT * FROM invenirabd.iap_activities WHERE iap_id = ${id}`;
			const [activities] = await this.adapter.db.query(query);
			return activities;
		},

		async getStatistics(ctx) {
			const { id } = ctx.params;

			try {
				// Get all activities in this deployed IAP using the action
				const activities = await ctx.call(
					"deployed_iaps.getActivities",
					{ id }
				);

				// Get all users who have scores for this deployed IAP
				const [userScores] = await this.adapter.db.query(`
					SELECT 
					  u.id AS user_id,
					  u.name AS user_name,
					  jsonb_object_agg(s.activity_id, s.score) AS scores,
					  COALESCE(AVG(s.score), 0) AS average
					FROM invenirabd.scores s
					JOIN invenirabd.users u ON s.user_id = u.id
					WHERE s.deployed_iap_id = ${id}
					GROUP BY u.id, u.name
				`);

				return userScores;
			} catch (error) {
				throw new MoleculerError(
					`Failed to get statistics: ${error.message}`,
					500
				);
			}
		},
	},
};
