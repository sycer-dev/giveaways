import { Entity, Column, BaseEntity, CreateDateColumn, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { ObjectType, Field, ID } from 'type-graphql';
import { Entry } from './Entry';

@ObjectType()
@Entity('giveaways')
export class Giveaway extends BaseEntity {
	/**
	 * The ID of the guild
	 */
	@Field(() => ID)
	@PrimaryGeneratedColumn('increment')
	public id!: number;

	/**
	 * The title of this giveaway
	 */
	@Field()
	@Column()
	public title!: string;

	/**
	 * The emoji used to react for entering this giveaway
	 */
	@Field()
	@Column()
	public emoji!: string;

	/**
	 * The guild Id this giveaway is running in
	 */
	@Field()
	@Column('bigint')
	public guild_id!: string;

	/**
	 * The channel the givaway is running in
	 */
	@Field()
	@Column('bigint')
	public channel_id!: string;

	/**
	 * The giveaway message ID
	 */
	@Field()
	@Column('bigint')
	public message_id!: string;

	/**
	 * The giveaway message ID
	 */
	@Field()
	@Column('bigint')
	public created_by!: string;

	/**
	 * The amount of winners this giveaway has
	 */
	@Field()
	@Column('int')
	public winners!: number;

	/**
	 * All the entries into this giveaway
	 */
	@Field(() => [Entry])
	@OneToMany(
		() => Entry,
		({ giveaway }) => giveaway,
	)
	public entries!: Entry[];

	/**
	 * When this giveaway should draw
	 */
	@Field()
	@Column('bigint')
	public draw_at!: Date;

	/**
	 * The date this row was created
	 */
	@Field()
	@CreateDateColumn()
	public created_at!: Date;
}
