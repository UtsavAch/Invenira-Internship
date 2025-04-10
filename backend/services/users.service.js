const { MoleculerError } = require("moleculer").Errors;
const Sequelize = require("sequelize");
const DbService = require("moleculer-db");
const SqlAdapter = require("moleculer-db-adapter-sequelize");
const { actions } = require("./host_system_handler.service.js");
const bcrypt = require("bcrypt");

module.exports = {
	name: "users",
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
		name: "users", //tabela "principal"
		schema: "invenirabd",
		timestamps: false,
		define: {
			name: Sequelize.STRING,
			email: Sequelize.STRING,
			password: Sequelize.STRING,
		},
	},

	actions: {
		async create(ctx) {
			const { name, email, password } = ctx.params;

			if (password.length < 8) {
				throw new MoleculerError(
					"Password must be at least 8 characters",
					400
				);
			}

			const existingUser = await this.adapter.model.findOne({
				where: { email },
			});
			if (existingUser) {
				throw new MoleculerError("Email already exists", 400);
			}

			const hashedPassword = await bcrypt.hash(password, 10);

			const user = await this.adapter.model.create({
				name,
				email,
				password: hashedPassword,
			});

			return user;
		},

		async login(ctx) {
			const { email, password } = ctx.params;

			const user = await this.adapter.model.findOne({ where: { email } });
			if (!user) {
				throw new MoleculerError("User not found", 404);
			}

			const passwordMatch = await bcrypt.compare(password, user.password);
			if (!passwordMatch) {
				throw new MoleculerError("Invalid password", 400);
			}

			return user;
		},

		async get(ctx) {
			const { id } = ctx.params;

			const user = await this.adapter.model.findOne({ where: { id } });
			if (!user) {
				throw new MoleculerError("User not found", 404);
			}

			return user;
		},

		async list(ctx) {
			const users = await this.adapter.model.findAll();

			return users;
		},

		async update(ctx) {
			const { id, name, email, password } = ctx.params;

			// Busca o usuário pelo ID
			const userToUpdate = await this.adapter.model.findOne({
				where: { id },
			});
			if (!userToUpdate) {
				throw new MoleculerError("User not found", 404);
			}
			const fieldsToUpdate = {};
			if (name !== undefined) fieldsToUpdate.name = name;
			if (email !== undefined) fieldsToUpdate.email = email;
			if (password !== undefined)
				fieldsToUpdate.password = await bcrypt.hash(password, 10);
			// Atualiza o usuário
			await userToUpdate.update(fieldsToUpdate);

			// Retorna o usuário atualizado
			return userToUpdate;
		},

		async remove(ctx) {
			const { id } = ctx.params;
			try {
				// 1. Find the user
				const user = await this.adapter.model.findOne({
					where: { id },
				});
				if (!user) {
					throw new MoleculerError("User not found", 404);
				}

				// 2. Get all IAPs owned by the user
				const [ownedIaps] = await this.adapter.db.query(
					`SELECT iap_id FROM "invenirabd".iap_ownership WHERE users_id = ${id} AND is_owner = TRUE`
				);

				// 3. Delete each owned IAP using the iap service
				for (const iap of ownedIaps) {
					await ctx.call("iap.remove", {
						id: iap.iap_id,
						user_id: id,
					});
				}

				// 4. Delete all remaining IAP ownership relationships (where user is not owner)
				await this.adapter.db.query(
					`DELETE FROM "invenirabd".iap_ownership WHERE users_id = ${id}`
				);

				// 5. Get all user's activity relationships
				const [userActivities] = await this.adapter.db.query(
					`SELECT activity_id FROM "invenirabd".users_activities WHERE users_id = ${id}`
				);

				// 6. Delete each activity using the broker call
				for (const ua of userActivities) {
					await ctx.call("activity.remove", {
						id: ua.activity_id,
						user_id: id,
					});
				}

				// 7. Delete the user
				await user.destroy();

				return { message: "User deleted successfully" };
			} catch (error) {
				throw new MoleculerError(
					"Failed to delete user: " + error.message,
					error.code || 500
				);
			}
		},
	},
};
