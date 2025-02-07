import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1738891516971 implements MigrationInterface {
    name = 'InitialSchema1738891516971'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "project" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" character varying NOT NULL, "description" text NOT NULL, "images" text NOT NULL, "tags" text NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "year" integer NOT NULL, CONSTRAINT "PK_4d68b1358bb5b766d3e78f32f57" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_a8c9319b1f0d38e955f9c0620d" ON "project" ("createdAt") `);
        await queryRunner.query(`CREATE INDEX "IDX_524528c3f3bc13645630597ec0" ON "project" ("year") `);
        await queryRunner.query(`CREATE TABLE "admin" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "username" character varying NOT NULL, "password" character varying NOT NULL, CONSTRAINT "UQ_5e568e001f9d1b91f67815c580f" UNIQUE ("username"), CONSTRAINT "PK_e032310bcef831fb83101899b10" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "contact" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "email" character varying NOT NULL, "message" text NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_2cbbe00f59ab6b3bb5b8d19f989" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."shop_item_status_enum" AS ENUM('available', 'sold', 'reserved')`);
        await queryRunner.query(`CREATE TABLE "shop_item" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "description" text NOT NULL, "images" text NOT NULL, "category" character varying NOT NULL, "status" "public"."shop_item_status_enum" NOT NULL DEFAULT 'available', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_45ef796043f3b27975c32d94d20" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_49cc6165629f2edbd64fe568de" ON "shop_item" ("status") `);
        await queryRunner.query(`CREATE INDEX "IDX_bd0dfa15e18e819b533ea49f85" ON "shop_item" ("createdAt") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_bd0dfa15e18e819b533ea49f85"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_49cc6165629f2edbd64fe568de"`);
        await queryRunner.query(`DROP TABLE "shop_item"`);
        await queryRunner.query(`DROP TYPE "public"."shop_item_status_enum"`);
        await queryRunner.query(`DROP TABLE "contact"`);
        await queryRunner.query(`DROP TABLE "admin"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_524528c3f3bc13645630597ec0"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_a8c9319b1f0d38e955f9c0620d"`);
        await queryRunner.query(`DROP TABLE "project"`);
    }

}
