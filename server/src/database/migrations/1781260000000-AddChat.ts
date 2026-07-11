import { MigrationInterface, QueryRunner } from "typeorm";

export class AddChat1781260000000 implements MigrationInterface {
    name = 'AddChat1781260000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "chat_messages" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "offerId" uuid NOT NULL, "senderId" uuid NOT NULL, "text" text, "readAt" TIMESTAMP WITH TIME ZONE, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_chat_messages" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_chat_messages_offer_created" ON "chat_messages" ("offerId", "createdAt") `);
        await queryRunner.query(`CREATE INDEX "IDX_chat_messages_offer_read" ON "chat_messages" ("offerId", "senderId", "readAt") `);
        await queryRunner.query(`CREATE TYPE "public"."chat_attachments_kind_enum" AS ENUM('image', 'document')`);
        await queryRunner.query(`CREATE TYPE "public"."chat_attachments_scanstatus_enum" AS ENUM('pending', 'clean', 'infected', 'skipped', 'error')`);
        await queryRunner.query(`CREATE TABLE "chat_attachments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "offerId" uuid NOT NULL, "messageId" uuid, "uploaderId" uuid NOT NULL, "kind" "public"."chat_attachments_kind_enum" NOT NULL, "mimeType" character varying NOT NULL, "size" integer NOT NULL, "originalName" character varying NOT NULL, "path" character varying NOT NULL, "scanStatus" "public"."chat_attachments_scanstatus_enum" NOT NULL DEFAULT 'pending', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_chat_attachments" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_chat_attachments_offer" ON "chat_attachments" ("offerId") `);
        await queryRunner.query(`CREATE INDEX "IDX_chat_attachments_message" ON "chat_attachments" ("messageId") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_chat_attachments_message"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_chat_attachments_offer"`);
        await queryRunner.query(`DROP TABLE "chat_attachments"`);
        await queryRunner.query(`DROP TYPE "public"."chat_attachments_scanstatus_enum"`);
        await queryRunner.query(`DROP TYPE "public"."chat_attachments_kind_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_chat_messages_offer_read"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_chat_messages_offer_created"`);
        await queryRunner.query(`DROP TABLE "chat_messages"`);
    }

}
