import { MigrationInterface, QueryRunner } from 'typeorm';

export class SessionLastSeen1790000000000 implements MigrationInterface {
  name = 'SessionLastSeen1790000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "sessions" ADD "lastSeenAt" TIMESTAMP WITH TIME ZONE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "sessions" DROP COLUMN "lastSeenAt"`);
  }
}
