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
			deploy_URL: Sequelize.STRING,
		},
	},

	actions: {
		async listDeployedByUser(ctx) {
			try {
				const { user_id } = ctx.params;

				const [results] = await this.adapter.db.query(
					`SELECT di.* FROM invenirabd.deployed_iaps di
                 JOIN invenirabd.iaps i ON di.name = i.name
                 JOIN invenirabd.iap_ownership io ON i.id = io.iap_id
                 WHERE io.users_id = ${user_id} AND io.is_owner = TRUE`
				);

				return results;
			} catch (error) {
				throw new MoleculerError(
					`Failed to list user's deployed IAPs: ${error.message}`,
					500
				);
			}
		},

		async listIapActivities(ctx) {
			try {
				const [results] = await this.adapter.db.query(
					"SELECT * FROM invenirabd.iap_activities"
				);
				return results;
			} catch (error) {
				throw new MoleculerError(
					`Failed to list iap activities: ${error.message}`,
					500
				);
			}
		},
	},
};
