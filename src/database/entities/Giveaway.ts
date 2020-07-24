import { Entity, BaseEntity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { GiveawayType } from '../../bot/util/constants';

export interface Boosted {
	string: string;
	entries: number;
}

@Entity('giveaways')
export default class Giveaway extends BaseEntity {
	@PrimaryGeneratedColumn('increment')
	public id!: number;

	@Column({ comment: 'the title of this giveaway' })
	public title!: string;

	@Column('enum', { enum: GiveawayType, default: GiveawayType.TRADITIONAL, comment: 'the type of giveaway this is' })
	public type!: GiveawayType;

	@Column({ comment: 'the emoji used to enter this giveaway' })
	public emoji!: string;

	@Column('bigint', { name: 'guild_id', comment: 'the id of the guild this giveaway belongs to' })
	public guildId!: string;

	@Column('bigint', { name: 'channel_id', comment: 'the id of the channel this giveaway is running it' })
	public channelId!: string;

	@Column('bigint', { name: 'message_id', comment: 'the id of the the giveaway message' })
	public messageId!: string;

	@Column('bigint', { comment: 'the amount of winners this giveaway has' })
	public winners!: number;

	@Column('jsonb', { nullable: true, comment: 'roles and their boosted entry count for a giveaway' })
	public boosted!: Boosted[];

	@Column('boolean', { default: false, comment: 'whether or not this giveaway is "fcfs"' })
	public fcfs!: boolean;

	@Column('timestamptz', { name: 'draw_at', nullable: true, comment: 'when this giveaway will draw at' })
	public drawAt!: Date;

	@Column('bigint', { name: 'created_by', comment: 'the user who created this giveaway' })
	public createdBy!: string;

	@Column('bigint', {
		name: 'max_entries',
		nullable: true,
		comment: 'the maximum amount of entries for a type 2 or 3 giveaway',
	})
	public maxEntries!: number;

	@Column('boolean', { default: false, comment: 'whether or not this giveaway was drawn' })
	public drawn!: boolean;
}
