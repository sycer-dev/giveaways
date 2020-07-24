import { Entity, BaseEntity, PrimaryColumn, Column } from 'typeorm';

@Entity('guilds')
export default class Guild extends BaseEntity {
	@PrimaryColumn('bigint', { comment: 'the Id of this guild' })
	public id!: string;

	@Column('varchar', { default: 'g', length: 16, comment: 'the command prefix' })
	public prefix!: string;

	@Column('bigint', { nullable: true, comment: 'the role Id of the giveaway manager' })
	public manager!: string | null;

	@Column('boolean', { default: false, comment: 'whether or not this guild is premium' })
	public premium!: boolean;

	@Column('timestamptz', { nullable: true })
	public expiresAt!: Date;
}
