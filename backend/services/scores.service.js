const { MoleculerError } = require("moleculer").Errors;
const Sequelize = require("sequelize");
const DbService = require("moleculer-db");
const SqlAdapter = require("moleculer-db-adapter-sequelize");

module.exports = {
	name: "scores",
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
		name: "scores",
		schema: "invenirabd",
		timestamps: false,
		define: {
			user_id: Sequelize.INTEGER,
			deployed_iap_id: Sequelize.INTEGER,
			activity_id: Sequelize.INTEGER,
			score: Sequelize.INTEGER,
		},
	},

	actions: {
		/**
		 * Record or update progress score
		 *
		 * @actions
		 * @param {Number} user_id - User ID
		 * @param {Number} deployed_iap_id - Deployed IAP ID
		 * @param {Number} activity_id - Activity ID
		 * @param {Number} score - Progress score (0-100)
		 * @returns {Object} Operation result
		 */
		async recordProgress(ctx) {
			const { user_id, deployed_iap_id, activity_id, score } = ctx.params;

			try {
				// Validate score range
				if (score < 0 || score > 100) {
					throw new MoleculerError(
						"Score must be between 0 and 100",
						400
					);
				}

				// Check for existing progress record
				const existing = await this.adapter.model.findOne({
					where: { user_id, deployed_iap_id, activity_id },
				});

				if (existing) {
					// Update existing record
					await existing.update({ score });
					return { success: true, message: "Progress updated" };
				} else {
					// Create new record
					await this.adapter.model.create({
						user_id,
						deployed_iap_id,
						activity_id,
						score,
					});
					return { success: true, message: "Progress recorded" };
				}
			} catch (error) {
				throw new MoleculerError(
					`Failed to save progress: ${error.message}`,
					error.code || 500
				);
			}
		},

		/**
		 * Get progress for an activity
		 *
		 * @actions
		 * @param {Number} user_id - User ID
		 * @param {Number} deployed_iap_id - Deployed IAP ID
		 * @param {Number} activity_id - Activity ID
		 * @returns {Number} Progress score
		 */
		async getActivityProgress(ctx) {
			const { user_id, deployed_iap_id, activity_id } = ctx.params;

			try {
				const record = await this.adapter.model.findOne({
					where: { user_id, deployed_iap_id, activity_id },
				});

				return record ? record.score : 0;
			} catch (error) {
				throw new MoleculerError(
					`Failed to get progress: ${error.message}`,
					500
				);
			}
		},

		/**
		 * Get all progress for a deployed IAP
		 *
		 * @actions
		 * @param {Number} user_id - User ID
		 * @param {Number} deployed_iap_id - Deployed IAP ID
		 * @returns {Object} Progress data
		 */
		async getDeployedIapProgress(ctx) {
			const { user_id, deployed_iap_id } = ctx.params;

			try {
				const records = await this.adapter.model.findAll({
					where: { user_id, deployed_iap_id },
				});

				return records.map((record) => ({
					activity_id: record.activity_id,
					score: record.score,
				}));
			} catch (error) {
				throw new MoleculerError(
					`Failed to get progress: ${error.message}`,
					500
				);
			}
		},

		async deleteByDeployedIapId(ctx) {
			const { deployed_iap_id } = ctx.params;
			try {
				await this.adapter.model.destroy({
					where: { deployed_iap_id },
				});
				return {
					success: true,
					message: "Scores deleted successfully",
				};
			} catch (error) {
				throw new MoleculerError(
					`Failed to delete scores: ${error.message}`,
					500
				);
			}
		},
	},
};
