const { MoleculerError } = require("moleculer").Errors;
const Sequelize = require("sequelize");
const DbService = require("moleculer-db");
const SqlAdapter = require("moleculer-db-adapter-sequelize");

module.exports = {
	name: "iap",
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
		name: "iaps", //tabela "principal"
		schema: "invenirabd",
		timestamps: false,
		define: {
			name: Sequelize.STRING,
			properties: Sequelize.JSON,
			nodes: Sequelize.JSON,
			edges: Sequelize.JSON,
		},
	},
	actions: {
		async create(ctx) {
			const { name, properties, nodes, edges, user_id } = ctx.params;
			try {
				const iap = await this.adapter.model.create({
					name,
					properties,
					nodes,
					edges,
				});
				// Insert ownership record
				await this.adapter.db.query(
					`INSERT INTO invenirabd.iap_ownership (users_id, iap_id, is_owner) 
				 VALUES (${user_id}, ${iap.id}, TRUE)`
				);
				return iap;
			} catch (error) {
				throw new MoleculerError(
					"Failed to create iap: " + error.message,
					500
				);
			}
		},

		async get(ctx) {
			const iap = await this.adapter.model.findOne({
				where: { id: ctx.params.id },
			});
			if (!iap) {
				throw new MoleculerError("IAP not found", 404);
			}
			return iap;
		},

		async list(ctx) {
			const { all, name, user_id } = ctx.params;
			if (all) {
				return await this.adapter.model.findAll();
			} else if (user_id) {
				// Get user's owned IAPs
				const [results] = await this.adapter.db.query(
					`SELECT i.* 
				FROM "invenirabd".iaps i
				JOIN "invenirabd".iap_ownership io ON i.id = io.iap_id
				WHERE io.users_id = ${user_id} AND io.is_owner = TRUE`
				);
				return results;
			} else {
				return await this.adapter.model.findAll({
					where: {
						name: {
							[Sequelize.Op.iLike]: `%${name}%`,
						},
					},
				});
			}
		},

		async update(ctx) {
			const { id, user_id, ...updateData } = ctx.params;
			try {
				// Check ownership
				const [ownership] = await this.adapter.db.query(
					`SELECT 1 FROM invenirabd.iap_ownership 
				 WHERE users_id = ${user_id} AND iap_id = ${id} AND is_owner = TRUE`
				);
				if (ownership.length === 0) {
					throw new MoleculerError(
						"Unauthorized: Not the IAP owner",
						403
					);
				}

				const iap = await this.adapter.model.findOne({ where: { id } });
				if (!iap) throw new MoleculerError("IAP not found", 404);

				await iap.update(updateData);
				return iap;
			} catch (error) {
				throw new MoleculerError(
					"Failed to update iap: " + error.message,
					500
				);
			}
		},

		async remove(ctx) {
			const { id, user_id } = ctx.params;
			try {
				// Check ownership
				const [ownership] = await this.adapter.db.query(
					`SELECT 1 FROM invenirabd.iap_ownership
				 WHERE users_id = ${user_id} AND iap_id = ${id} AND is_owner = TRUE`
				);
				if (ownership.length === 0) {
					throw new MoleculerError(
						"Unauthorized: Not the IAP owner",
						403
					);
				}

				// Delete related ownership entries
				await this.adapter.db.query(
					`DELETE FROM invenirabd.iap_ownership WHERE iap_id = ${id}`
				);

				// Delete IAP
				await this.adapter.model.destroy({ where: { id } });
				return { message: "IAP deleted" };
			} catch (error) {
				throw new MoleculerError(
					"Failed to delete iap: " + error.message,
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
	},
};
