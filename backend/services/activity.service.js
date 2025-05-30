const { MoleculerError } = require("moleculer").Errors;
const Sequelize = require("sequelize");
const DbService = require("moleculer-db");
const SqlAdapter = require("moleculer-db-adapter-sequelize");

module.exports = {
	name: "activity",
	mixins: [DbService],
	adapter: new SqlAdapter(
		// "postgres://inveniraUser:password123@db:5432/inveniraBD?schema=invenirabd",
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
		name: "activity", //tabela "principal"
		schema: "invenirabd",
		timestamps: false,
		define: {
			name: Sequelize.STRING,
			properties: Sequelize.JSON,
			config_url: Sequelize.STRING,
			json_params: Sequelize.STRING,
			//json_params_url: Sequelize.STRING,
			user_url: Sequelize.STRING,
			analytics: Sequelize.STRING,
			//analytics_url: Sequelize.STRING,
			//analytics_list_url: Sequelize.TEXT,
			is_deployed: Sequelize.BOOLEAN,
		},
	},

	actions: {
		/**
		 * Register a new activity
		 *
		 * @actions
		 * @param {Object} Activity - Activity details. Name is mandatory
		 * @returns {Object} Created entity + id
		 */
		async create(ctx) {
			const {
				name,
				properties,
				config_url,
				json_params,
				user_url,
				analytics,
				user_id, // Receive user_id
			} = ctx.params;
			try {
				// Create the activity
				const activity = await this.adapter.model.create({
					name,
					properties,
					config_url,
					json_params,
					user_url,
					analytics,
				});

				// Insert into users_activities
				await this.adapter.db.query(
					`INSERT INTO invenirabd.users_activities (users_id, activity_id, is_owner) 
					 VALUES (${user_id}, ${activity.id}, TRUE)`
				);

				return activity;
			} catch (error) {
				throw new MoleculerError(
					"Failed to create activity: " + error.message,
					500
				);
			}
		},
		/**
		 * Delete an activity
		 *
		 * @actions
		 * @param {String} id - Activity ID
		 * @returns
		 */
		async remove(ctx) {
			const { id, user_id } = ctx.params;
			const transaction = await this.adapter.db.transaction(); // Start transaction

			try {
				// Ownership check (outside transaction as it's a read operation)
				const [ownership] = await this.adapter.db.query(
					`SELECT 1 FROM "invenirabd".users_activities 
					 WHERE users_id = ${user_id} 
					 AND activity_id = ${id} 
					 AND is_owner = TRUE`
				);
				if (ownership.length === 0) {
					await transaction.rollback();
					throw new MoleculerError(
						"Unauthorized: Not the activity owner",
						403
					);
				}

				// Connection check (should also be in transaction if it writes)
				const connections = await ctx.call(
					"activity_connections.getByActivity",
					{
						activity_id: id,
					}
				);
				if (connections.length > 0) {
					await transaction.rollback();
					throw new MoleculerError(
						"Activity is used in IAP connections and cannot be deleted",
						400
					);
				}

				// Delete analytics
				await this.adapter.db.query(
					`DELETE FROM "invenirabd".analytics WHERE activity_id = ${id}`,
					{ transaction }
				);

				// Delete user associations
				await this.adapter.db.query(
					`DELETE FROM "invenirabd".users_activities WHERE activity_id = ${id}`,
					{ transaction }
				);

				// Delete activity
				await this.adapter.model.destroy({
					where: { id },
					transaction,
				});

				await transaction.commit(); // Commit if all succeed
				return;
			} catch (error) {
				await transaction.rollback(); // Rollback on any error
				throw new MoleculerError(
					error.message || "Failed to delete activity",
					error.code || 500
				);
			}
		},

		/**
		 * Update an activity
		 *
		 * @actions
		 * @param {Object} Activity - Activity details. Name is mandatory
		 * @returns {Object} Activity
		 */
		async update(ctx) {
			const { id, user_id, ...updateData } = ctx.params;
			try {
				// 1. Find the activity
				const activity = await this.adapter.model.findOne({
					where: { id },
				});
				if (!activity)
					throw new MoleculerError("Activity not found", 404);

				// 2. Check ownership via users_activities table
				const [ownership] = await this.adapter.db.query(
					`SELECT 1 FROM "invenirabd".users_activities 
					 WHERE users_id = ${user_id} 
					 AND activity_id = ${id} 
					 AND is_owner = TRUE`
				);

				if (ownership.length === 0) {
					throw new MoleculerError(
						"Unauthorized: Not the activity owner",
						403
					);
				}

				// 3. Proceed with update
				await activity.update(updateData);
				return activity;
			} catch (error) {
				throw new MoleculerError(error.message, error.code || 500);
			}
		},
		/**
		 * Get Activity
		 *
		 * @actions
		 * @param {String} id - Activity ID
		 * @returns {Object} Activity if found
		 */
		async get(ctx) {
			try {
				const activity = await this.adapter.model.findOne({
					where: { id: ctx.params.id },
				});
				if (!activity) {
					throw new MoleculerError("Activity not found", 404);
				}
				return activity;
			} catch (error) {
				throw new MoleculerError(
					"Failed to get activity: " + error.message,
					500
				);
			}
		},
		/**
		 * List Activities
		 *
		 * @actions
		 * @returns {Array} List of available Activities
		 */
		async list(ctx) {
			const { all, name, user_id, deployed, owner, profile } = ctx.params;

			if (all) {
				return await this.adapter.model.findAll();
			}

			if (user_id) {
				let query;
				if (owner) {
					// Fetch activities where the user is the owner (regardless of deployment status)
					query = `
					SELECT a.* 
					FROM "invenirabd".activities a
					INNER JOIN "invenirabd".users_activities ua 
					  ON a.id = ua.activity_id 
					  AND ua.users_id = ${user_id}
					  AND ua.is_owner = TRUE
				  `;
				} else if (profile) {
					//Get activities where user is owner OR has added
					query = `
					SELECT 
					a.*,
					ua.is_owner as is_owner,
					(ua.is_owner = FALSE) as is_added
					FROM "invenirabd".activities a
					INNER JOIN "invenirabd".users_activities ua 
					ON a.id = ua.activity_id 
					AND ua.users_id = ${user_id}
					WHERE a.is_deployed = TRUE 
				`;
				} else {
					// Existing query for deployed activities user has access to
					query = `
					SELECT 
					  a.*, 
					  COALESCE(ua.is_owner, FALSE) as is_owner,
					  (ua.activity_id IS NOT NULL AND ua.is_owner = FALSE) as is_added
					FROM "invenirabd".activities a
					LEFT JOIN "invenirabd".users_activities ua 
					  ON a.id = ua.activity_id 
					  AND ua.users_id = ${user_id}
					WHERE a.is_deployed = TRUE
				  `;
				}
				const [results] = await this.adapter.db.query(query);
				return results;
			}

			if (deployed !== undefined) {
				return await this.adapter.model.findAll({
					where: { is_deployed: deployed },
				});
			}

			if (name) {
				return await this.adapter.model.findAll({
					where: { name: { [Sequelize.Op.iLike]: `%${name}%` } },
				});
			}
		},

		async deploy(ctx) {
			const { id, user_id, analytics } = ctx.params;
			try {
				// 1. Verify ownership
				const [ownership] = await this.adapter.db.query(
					`SELECT 1 FROM "invenirabd".users_activities 
		 WHERE users_id = ${user_id} AND activity_id = ${id}`
				);
				if (ownership.length === 0)
					throw new MoleculerError("Unauthorized", 403);

				// 2. Validate analytics
				if (analytics && analytics.length === 0)
					throw new MoleculerError(
						"At least one analytic required",
						400
					);

				// 3. Start transaction
				const transaction = await this.adapter.db.transaction();

				try {
					// Update activity
					await this.adapter.model.update(
						{ is_deployed: true },
						{ where: { id }, transaction }
					);

					// Create analytics
					for (const analytic of analytics) {
						await this.adapter.db.query(
							`INSERT INTO "invenirabd".analytics 
			 (activity_id, name, score) 
			 VALUES (${id}, '${analytic.name}', 0)`,
							{ transaction }
						);
					}

					await transaction.commit();
					return { success: true };
				} catch (error) {
					await transaction.rollback();
					throw error;
				}
			} catch (error) {
				throw new MoleculerError(error.message, error.code || 500);
			}
		},

		async listAnalytics(ctx) {
			try {
				const [results] = await this.adapter.db.query(
					"SELECT * FROM invenirabd.analytics"
				);
				return results;
			} catch (error) {
				throw new MoleculerError(
					`Failed to list analytics: ${error.message}`,
					500
				);
			}
		},

		async addToUser(ctx) {
			const { activity_id, user_id } = ctx.params;
			try {
				// Check if activity is deployed
				const activity = await this.adapter.model.findOne({
					where: { id: activity_id, is_deployed: true },
				});

				if (!activity) {
					throw new MoleculerError(
						"Activity not available for adding",
						400
					);
				}

				// Check existing ownership
				const [existing] = await this.adapter.db.query(
					`SELECT 1 FROM invenirabd.users_activities 
				 WHERE users_id = ${user_id} AND activity_id = ${activity_id}`
				);

				if (existing.length > 0) {
					throw new MoleculerError(
						"You already added the activity",
						409
					);
				}

				// Create the association
				await this.adapter.db.query(
					`INSERT INTO invenirabd.users_activities 
				 (users_id, activity_id) VALUES (${user_id}, '${activity_id}')`
				);

				return { success: true };
			} catch (error) {
				console.error("Add to user error:", error);
				throw new MoleculerError(
					error.message || "Failed to add activity",
					error.code || 500
				);
			}
		},
	},
};
