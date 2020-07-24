import { Length } from 'class-validator';
import { Arg, Field, InputType, Mutation, Query, Resolver } from 'type-graphql';
import { Guild } from '../../models/Guild';

@InputType()
export class CreateGuildInput {
	@Field()
	@Length(17, 21)
	public id!: string;

	@Field({ defaultValue: process.env.COMMAND_PREFIX! })
	@Length(1, 10)
	public prefix!: string;
}

@Resolver()
export class CreateGuildResolver {
	@Mutation(() => Guild)
	public async createGuild(
		@Arg('data')
		{ id, prefix }: CreateGuildInput,
	): Promise<Guild> {
		const row = await Guild.create({
			id,
			prefix,
		}).save();

		return row;
	}
}

@Resolver()
export class GetGuildResolver {
	@Query(() => Guild)
	public async getGuild(@Arg('id') id: string): Promise<Guild | undefined> {
		const row = await Guild.findOne({ id });
		if (!row) return Guild.create({ id }).save();
		return row;
	}

	// @Query(() => [Guild])
	// public async find(): Promise<ReactionRole[]> {
	// 	const params: { [key: string]: string } = {};
	// 	// @ts-ignore
	// 	for (const key of Object.keys(args)) params[key] = args[key];
	// 	const rows = await ReactionRole.find(params);
	// 	return rows;
	// }
}

@Resolver()
export class DeleteGuildResolver {
	@Query(() => Boolean)
	public async deleteGuild(@Arg('id') id: string): Promise<boolean | undefined> {
		const row = await Guild.findOne({ id });
		if (row) await Guild.remove(row);
		return row ? true : false;
	}
}
