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
			try {
				const deployedIaps = await this.adapter.model.findAll();
				return deployedIaps;
			} catch (error) {
				throw new MoleculerError(
					`Failed to retrieve deployed IAPs: ${error.message}`,
					500
				);
			}
		},

		//Delete a deployed iap
		// async deleteDeployedIap(ctx) {
		// 	try {
		// 		const { id, user_id } = ctx.params;

		// 		// Get the deployed IAP to retrieve its iap_id
		// 		const deployedIap = await this.adapter.model.findOne({
		// 			where: { id },
		// 		});
		// 		if (!deployedIap) {
		// 			throw new MoleculerError("Deployed IAP not found", 404);
		// 		}

		// 		// Check ownership of the original IAP
		// 		const [ownership] = await this.adapter.db.query(`
		//     SELECT 1 FROM invenirabd.iap_ownership
		//     WHERE users_id = ${user_id} AND iap_id = ${deployedIap.iap_id} AND is_owner = TRUE
		// `);
		// 		if (!ownership.length) {
		// 			throw new MoleculerError(
		// 				"Unauthorized: Not the IAP owner",
		// 				403
		// 			);
		// 		}

		// 		// Delete related iap_activities entries
		// 		await this.adapter.db.query(
		// 			`DELETE FROM invenirabd.iap_activities WHERE iap_id = ${id}`
		// 		);

		// 		// Delete the deployed IAP
		// 		await this.adapter.model.destroy({ where: { id } });

		// 		return { message: "Deployed IAP deleted successfully" };
		// 	} catch (error) {
		// 		throw new MoleculerError(
		// 			`Failed to delete deployed IAP: ${error.message}`,
		// 			500
		// 		);
		// 	}
		// },

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
	},
};
