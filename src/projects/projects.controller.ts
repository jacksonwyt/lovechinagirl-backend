// src/projects/projects.controller.ts

import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, UseInterceptors, UploadedFiles, ParseUUIDPipe } from '@nestjs/common';
import { JwtAuthGuard } from '../admin/jwt-auth.guard';
import { ProjectsService } from './projects.service';
import { Project } from './project.entity';
import { FilesInterceptor } from '@nestjs/platform-express';
import { multerConfig } from '../common/middleware/upload.middleware';
import { CreateProjectDto, UpdateProjectDto } from './dto/project.dto';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  findAll(): Promise<Project[]> {
    return this.projectsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Project> {
    return this.projectsService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  @UseInterceptors(FilesInterceptor('images', 10, multerConfig))
  create(@Body() project: CreateProjectDto, @UploadedFiles() files: Express.Multer.File[]): Promise<Project> {
    return this.projectsService.create(project, files);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  @UseInterceptors(FilesInterceptor('images', 10, multerConfig))
  update(
    @Param('id', ParseUUIDPipe) id: string, 
    @Body() project: UpdateProjectDto,
    @UploadedFiles() files: Express.Multer.File[]
  ): Promise<Project> {
    return this.projectsService.update(id, project, files);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.projectsService.remove(id);
  }
}
