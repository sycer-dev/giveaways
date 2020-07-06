import { Entity, Column, BaseEntity, CreateDateColumn, PrimaryColumn } from 'typeorm';
import { ObjectType, Field, ID } from 'type-graphql';

@ObjectType()
@Entity('guilds')
export class Guild extends BaseEntity {
	/**
	 * The ID of the guild
	 */
	@Field(() => ID)
	@PrimaryColumn('bigint')
	public id!: string;

	/**
	 * The command prefix for this guild
	 */
	@Field()
	@Column({ default: process.env.COMMAND_PREFIX })
	public prefix!: string;

	/**
	 * The date this row was created
	 */
	@Field()
	@CreateDateColumn()
	public created_at!: Date;
}
