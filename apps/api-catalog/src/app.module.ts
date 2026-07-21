import { Module } from "@nestjs/common";
import { DatabaseModule } from "./database/database.module";
import { HealthController } from "./health/health.controller";
import { WorksModule } from "./works/works.module";
import { BooksModule } from "./books/books.module";
import { AuthorsModule } from "./authors/authors.module";
import { PublishersModule } from "./publishers/publishers.module";
import { CollectionsModule } from "./collections/collections.module";
import { ThemesModule } from "./themes/themes.module";
import { GenresModule } from "./genres/genres.module";

// One module per aggregate root (coding-guidelines.md), mirroring
// SPEC-15's core entities. Root module wires nothing beyond that plus
// the global DatabaseModule — no cross-cutting business logic lives
// here.
@Module({
  imports: [
    DatabaseModule,
    WorksModule,
    BooksModule,
    AuthorsModule,
    PublishersModule,
    CollectionsModule,
    ThemesModule,
    GenresModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
