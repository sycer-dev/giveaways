import { IsEmail, Length } from 'class-validator';
import { Arg, Ctx, Field, InputType, Mutation, Query, Resolver, ArgsType, Args } from 'type-graphql';
import { Guild } from '../models/Guild';

@InputType()
export class CreateInput {
	@Field()
	@Length(17, 21)
	public id!: string;

	@Field({ defaultValue: process.env.COMMAND_PREFIX! })
	@Length(1, 10)
	public prefix!: string;
}

@Resolver()
export class CreateResolver {
	@Query(() => String)
	public async hello() {
		return 'Hello World!';
	}

	@Mutation(() => Guild)
	public async create(
		@Arg('data')
		{ id, prefix }: CreateInput,
	): Promise<Guild> {
		const row = await Guild.create({
			id, prefix,
		}).save();

		return row;
	}
}

@Resolver()
export class GetResolver {
	@Query(() => Guild)
	public async get(
		@Arg('id') id: string,
	): Promise<Guild | undefined> {
		const row = await Guild.findOne({ id });
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
export class DeleteResolver {
	@Query(() => Boolean)
	public async delete(
		@Arg('id') id: string,
	): Promise<boolean | undefined> {
		const row = await Guild.findOne({ id });
		if (row) await Guild.remove(row);
		return row ? true : false;
	}
}
