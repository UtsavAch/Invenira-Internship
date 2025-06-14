const { MoleculerError } = require("moleculer").Errors;
const Sequelize = require("sequelize");

module.exports = {
	name: "progress",

	async started() {
		this.sequelize = new Sequelize(
			"postgres://uutsavacharya15@localhost:5432/inveniraBD?schema=invenirabd",
			{
				dialect: "postgres",
				logging: false,
				define: {
					timestamps: false,
				},
				dialectOptions: {
					prependSearchPath: true,
				},
				searchPath: "invenirabd",
			}
		);
		await this.sequelize.authenticate();
	},

	actions: {
		async recordProgress(ctx) {
			const { activity_id, progress } = ctx.params;

			try {
				const transaction = await this.sequelize.transaction();

				// Check if record exists for this activity
				const [existing] = await this.sequelize.query(
					`SELECT id FROM invenirabd.analytics 
                     WHERE activity_id = :activity_id`,
					{
						replacements: { activity_id },
						transaction,
						type: Sequelize.QueryTypes.SELECT,
					}
				);

				if (existing && existing.length > 0) {
					// Update existing record
					await this.sequelize.query(
						`UPDATE invenirabd.analytics 
                         SET score = :progress 
                         WHERE activity_id = :activity_id`,
						{
							replacements: { progress, activity_id },
							transaction,
							type: Sequelize.QueryTypes.UPDATE,
						}
					);
				} else {
					// Insert new record
					await this.sequelize.query(
						`INSERT INTO invenirabd.analytics 
                         (activity_id, name, score)
                         VALUES (:activity_id, 'Activity Progress', :progress)`,
						{
							replacements: { activity_id, progress },
							transaction,
							type: Sequelize.QueryTypes.INSERT,
						}
					);
				}

				await transaction.commit();
				return { success: true };
			} catch (error) {
				throw new MoleculerError(
					`Failed to record progress: ${error.message}`,
					500
				);
			}
		},

		async getActivityProgress(ctx) {
			const { activity_id } = ctx.params;

			try {
				const [result] = await this.sequelize.query(
					`SELECT score FROM invenirabd.analytics 
                     WHERE activity_id = :activity_id`,
					{
						replacements: { activity_id },
						type: Sequelize.QueryTypes.SELECT,
					}
				);

				return result ? result.score : 0;
			} catch (error) {
				throw new MoleculerError(
					`Failed to get activity progress: ${error.message}`,
					500
				);
			}
		},

		async getObjectiveProgress(ctx) {
			const { deployed_iap_id } = ctx.params;

			try {
				const results = await this.sequelize.query(
					`
                    SELECT o.id, o.name, COALESCE(MAX(a.score), 0) AS progress
                    FROM invenirabd.objective o
                    LEFT JOIN invenirabd.objective_analytics oa ON o.id = oa.objective_id
                    LEFT JOIN invenirabd.analytics a ON oa.analytics_id = a.id
                    WHERE o.iap_id = (
                        SELECT iap_id 
                        FROM invenirabd.deployed_iaps 
                        WHERE id = :deployed_iap_id
                    )
                    GROUP BY o.id, o.name
                    `,
					{
						replacements: { deployed_iap_id },
						type: Sequelize.QueryTypes.SELECT,
					}
				);

				return results;
			} catch (error) {
				throw new MoleculerError(
					`Failed to get progress: ${error.message}`,
					500
				);
			}
		},
	},
};
