import { Length } from 'class-validator';
import { Arg, Field, InputType, Mutation, Query, Resolver } from 'type-graphql';
import { Entry } from '../../models/Entry';
import { Giveaway } from '../../models/Giveaway';

@InputType()
export class CreateEntryInput {
	@Field()
	@Length(17, 21)
	public user_id!: string;

	@Field()
	@Length(17, 21)
	public message_id!: string;
}

@Resolver()
export class CreateEntryResolver {
	@Mutation(() => Entry)
	public async createEntry(
		@Arg('data')
		{ user_id, message_id }: CreateEntryInput,
	): Promise<Entry> {
		const giveaway = await Giveaway.findOne(
			{ message_id },
			{
				relations: ['entries'],
			},
		);

		if (!giveaway) throw Error('Invalid giveaway message ID.');

		const entry = await Entry.create({
			user_id,
			giveaway,
		}).save();

		giveaway.entries.push(entry);
		await giveaway.save();

		return entry;
	}
}

@Resolver()
export class GetEntryResolver {
	@Query(() => Entry)
	public async getEntry(@Arg('message_id') message_id: string, @Arg('user_id') user_id: string): Promise<Entry | undefined> {
		const giveaway = await Giveaway.findOne({ message_id });
		if (!giveaway) throw Error('Invalid giveaway message ID.');

		const row = await Entry.findOne({ user_id, giveaway });
		if (!row) throw Error('Entry not found.');

		return row;
	}

	@Query(() => [Entry])
	public async findEntry(@Arg('message_id') message_id: string): Promise<Entry[]> {
		const giveaway = await Giveaway.findOne({ message_id });
		if (!giveaway) throw Error('Invalid giveaway message ID.');

		return giveaway.entries;
	}
}

@Resolver()
export class DeleteEntryResolver {
	@Query(() => Entry)
	public async deleteEntry(@Arg('message_id') message_id: string, @Arg('user_id') user_id: string): Promise<boolean> {
		const giveaway = await Giveaway.findOne({ message_id });
		if (!giveaway) throw Error('Invalid giveaway message ID.');

		const row = await Entry.findOne({ user_id, giveaway });
		if (row) await Entry.remove(row);

		return row ? true : false;
	}
}
