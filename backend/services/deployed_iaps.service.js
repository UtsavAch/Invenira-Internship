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
		async deleteDeployedIap(ctx) {
			try {
				const { id } = ctx.params;

				// Delete related entries in iap_activities
				await this.adapter.db.query(
					`DELETE FROM invenirabd.iap_activities WHERE iap_id = ${id}`
				);

				// Delete the deployed IAP
				const result = await this.adapter.model.destroy({
					where: { id },
				});

				if (result === 0) {
					throw new MoleculerError("Deployed IAP not found", 404);
				}

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
