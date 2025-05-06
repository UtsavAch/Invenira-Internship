const { MoleculerError } = require("moleculer").Errors;
const Sequelize = require("sequelize");
const DbService = require("moleculer-db");
const SqlAdapter = require("moleculer-db-adapter-sequelize");

module.exports = {
	name: "activity_connections",
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
		name: "activity_connections",
		schema: "invenirabd",
		timestamps: false,
		createdAt: null,
		updatedAt: null,
		define: {
			source: {
				type: Sequelize.INTEGER,
				primaryKey: true,
			},
			target: {
				type: Sequelize.INTEGER,
				primaryKey: true,
			},
			iap_id: {
				type: Sequelize.INTEGER,
				primaryKey: true,
			},
			label: Sequelize.STRING,
		},
	},

	actions: {
		/**
		 * Create activity connections for an IAP
		 */
		async create(ctx) {
			const { iap_id, edges } = ctx.params;
			try {
				const connections = edges.map((edge) => ({
					source: edge.source,
					target: edge.target,
					iap_id: iap_id,
					label: edge.label || "not-completed",
				}));

				// First delete existing connections
				await this.adapter.model.destroy({
					where: { iap_id },
				});

				// Then create new ones
				return await this.adapter.model.bulkCreate(connections);
			} catch (error) {
				throw new MoleculerError(
					`Failed to create connections: ${error.message}`,
					500
				);
			}
		},
		/**
		 * Delete all connections for an IAP
		 */
		async deleteByIap(ctx) {
			const { iap_id } = ctx.params;
			try {
				return await this.adapter.model.destroy({
					where: { iap_id },
				});
			} catch (error) {
				throw new MoleculerError(
					`Failed to delete connections: ${error.message}`,
					500
				);
			}
		},

		/**
		 * Get connections involving a specific activity
		 */
		async getByActivity(ctx) {
			const { activity_id } = ctx.params;
			try {
				return await this.adapter.model.findAll({
					where: {
						[Sequelize.Op.or]: [
							{ source: activity_id },
							{ target: activity_id },
						],
					},
					raw: true,
				});
			} catch (error) {
				throw new MoleculerError(
					`Failed to get connections: ${error.message}`,
					500
				);
			}
		},
		/**
		 * List all activity connections
		 */
		async list() {
			try {
				return await this.adapter.model.findAll();
			} catch (error) {
				throw new MoleculerError(
					`Failed to list connections: ${error.message}`,
					500
				);
			}
		},
	},
};
