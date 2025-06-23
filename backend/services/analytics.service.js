const { MoleculerError } = require("moleculer").Errors;
const Sequelize = require("sequelize");
const DbService = require("moleculer-db");
const SqlAdapter = require("moleculer-db-adapter-sequelize");

module.exports = {
	name: "analytics",
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
		name: "analytics",
		schema: "invenirabd",
		timestamps: false,
		define: {
			activity_id: Sequelize.INTEGER,
			name: Sequelize.STRING,
			score: Sequelize.INTEGER,
		},
	},

	actions: {
		/**
		 * Get analytics for activities in an IAP that the user has access to
		 *
		 * @param {Number} iap_id - ID of the IAP
		 * @param {Number} user_id - ID of the user
		 * @returns {Object} Analytics data for the IAP activities
		 */
		async getAnalytics(ctx) {
			const { iap_id, user_id } = ctx.params;

			try {
				// 1. Verify user has relationship with IAP (either owner or not)
				const [relationship] = await this.adapter.db.query(`
					SELECT 1 
					FROM invenirabd.iap_ownership 
					WHERE users_id = ${user_id} 
					  AND iap_id = ${iap_id}
				`);

				if (relationship.length === 0) {
					throw new MoleculerError(
						"User doesn't have access to this IAP",
						403
					);
				}

				// 2. Get IAP details
				const [iaps] = await this.adapter.db.query(`
					SELECT * 
					FROM invenirabd.iaps 
					WHERE id = ${iap_id}
				`);

				if (iaps.length === 0) {
					throw new MoleculerError("IAP not found", 404);
				}

				const iap = iaps[0];
				const nodes = JSON.parse(iap.nodes);
				const activityIds = nodes.map((node) => node.id);

				// 3. Get analytics for each activity that user has access to
				const activitiesData = [];
				for (const activityId of activityIds) {
					// Check if user has access to this activity
					const [activityAccess] = await this.adapter.db.query(`
						SELECT 1
						FROM invenirabd.users_activities
						WHERE users_id = ${user_id}
						  AND activity_id = ${activityId}
					`);

					if (activityAccess.length > 0) {
						const [activities] = await this.adapter.db.query(`
							SELECT * 
							FROM invenirabd.activities 
							WHERE id = ${activityId}
						`);

						if (activities.length > 0) {
							const activity = activities[0];
							const [analytics] = await this.adapter.db.query(`
								SELECT * 
								FROM invenirabd.analytics 
								WHERE activity_id = ${activityId}
							`);

							activitiesData.push({
								activity_id: activityId,
								name: activity.name,
								analytics: analytics,
							});
						}
					}
				}

				return {
					iap_id: iap.id,
					iap_name: iap.name,
					activities: activitiesData,
				};
			} catch (error) {
				throw new MoleculerError(
					`Failed to get analytics: ${error.message}`,
					error.code || 500
				);
			}
		},

		/**
		 * Update analytics score for an activity that the user has access to
		 *
		 * @param {Number} analytics_id - ID of the analytics record
		 * @param {Number} score - New score value
		 * @param {Number} user_id - ID of the user
		 * @returns {Object} Success status
		 */
		async setAnalyticsScore(ctx) {
			const { analytics_id, score, user_id } = ctx.params;

			try {
				// 1. Get analytics record and associated activity
				const [analytics] = await this.adapter.db.query(`
					SELECT * 
					FROM invenirabd.analytics 
					WHERE id = ${analytics_id}
				`);

				if (analytics.length === 0) {
					throw new MoleculerError("Analytics record not found", 404);
				}

				const activityId = analytics[0].activity_id;

				// 2. Verify user has access to this activity
				const [activityAccess] = await this.adapter.db.query(`
					SELECT 1
					FROM invenirabd.users_activities
					WHERE users_id = ${user_id}
					  AND activity_id = ${activityId}
				`);

				if (activityAccess.length === 0) {
					throw new MoleculerError(
						"User doesn't have access to this activity",
						403
					);
				}

				// 3. Update the score
				await this.adapter.db.query(`
					UPDATE invenirabd.analytics
					SET score = ${score}
					WHERE id = ${analytics_id}
				`);

				return { success: true };
			} catch (error) {
				throw new MoleculerError(
					`Failed to update analytics score: ${error.message}`,
					error.code || 500
				);
			}
		},
	},
};
