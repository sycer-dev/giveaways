import { Entity, Column, BaseEntity, CreateDateColumn, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { ObjectType, Field, ID } from 'type-graphql';
import { Giveaway } from './Giveaway';

@ObjectType()
@Entity('entries')
export class Entry extends BaseEntity {
	/**
	 * The ID of this giveaway entry
	 */
	@Field(() => ID)
	@PrimaryGeneratedColumn('increment')
	public id!: number;

	/**
	 * The user this entry belongs to
	 */
	@Field()
	@Column('bigint')
	public user_id!: string;

	/**
	 * The giveaway this entry corresponds to
	 */
	@Field(() => Giveaway)
	@ManyToOne(
		() => Giveaway,
		({ entries }) => entries,
	)
	public giveaway!: Giveaway;

	/**
	 * The date this row was created
	 */
	@Field()
	@CreateDateColumn()
	public created_at!: Date;
}
