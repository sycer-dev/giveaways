import { Length, IsNumber, IsDate } from 'class-validator';
import { Arg, Field, InputType, Mutation, Query, Resolver, ArgsType, Args } from 'type-graphql';
import { Giveaway } from '../../models/Giveaway';

@InputType()
export class CreateGiveawayInput {
	@Field()
	@Length(1)
	public title!: string;

	@Field()
	@Length(1)
	public emoji!: string;

	@Field()
	@Length(17, 21)
	public guild_id!: string;

	@Field()
	@Length(17, 21)
	public channel_id!: string;

	@Field()
	@Length(17, 21)
	public message_id!: string;

	@Field()
	@Length(17, 21)
	public created_by!: string;

	@Field()
	@IsNumber()
	public winners!: number;

	@Field()
	@IsDate()
	public draw_at!: Date;
}

@Resolver()
export class CreateGiveawayResolver {
	@Mutation(() => Giveaway)
	public async createGiveaway(
		@Arg('data')
		{ title, emoji, guild_id, channel_id, message_id, winners, draw_at }: CreateGiveawayInput,
	): Promise<Giveaway> {
		const row = await Giveaway.create({
			title,
			emoji,
			guild_id,
			channel_id,
			message_id,
			winners,
			draw_at,
		}).save();

		return row;
	}
}

@ArgsType()
export class FindGiveawayArgs {
	@Length(17, 21)
	@Field({ nullable: true })
	public guild_id?: string;

	@Length(17, 21)
	@Field({ nullable: true })
	public channel_id?: string;

	@Length(17, 21)
	@Field({ nullable: true })
	public message_id?: string;

	@Length(17, 21)
	@Field({ nullable: true })
	public created_by?: string;

	@Length(17, 21)
	@Field({ nullable: true })
	public emoji?: string;
}

@Resolver()
export class GetGiveawayResolver {
	@Query(() => Giveaway)
	public async getGiveaway(@Arg('message_id') message_id: string): Promise<Giveaway | undefined> {
		const row = await Giveaway.findOne({ message_id });
		return row;
	}

	@Query(() => [Giveaway])
	public async findGiveaway(@Args() args: FindGiveawayArgs): Promise<Giveaway[]> {
		const params: { [key: string]: string } = {};
		// @ts-ignore
		for (const key of Object.keys(args)) params[key] = args[key];
		const rows = await Giveaway.find(params);
		return rows;
	}
}

@Resolver()
export class DeleteGiveawayResolver {
	@Query(() => Boolean)
	public async deleteGiveaway(@Arg('message_id') message_id: string): Promise<boolean | undefined> {
		const row = await Giveaway.findOne({ message_id });
		if (row) await Giveaway.remove(row);
		return row ? true : false;
	}
}
