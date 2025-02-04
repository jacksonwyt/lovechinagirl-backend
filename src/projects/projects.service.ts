// src/projects/projects.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from './project.entity';
import { ConfigService } from '@nestjs/config';
import { uploadToS3 } from '../common/middleware/upload.middleware';

type ProjectDto = Omit<Partial<Project>, 'tags'> & {
 tags?: string | string[];
};

@Injectable()
export class ProjectsService {
 constructor(
   @InjectRepository(Project)
   private projectsRepository: Repository<Project>,
   private configService: ConfigService,
 ) {}

 findAll(): Promise<Project[]> {
   return this.projectsRepository.find({
     order: { createdAt: 'DESC' }
   });
 }

 async findOne(id: string): Promise<Project> {
   const project = await this.projectsRepository.findOneBy({ id });
   if (!project) {
     throw new NotFoundException(`Project with ID ${id} not found`);
   }
   return project;
 }

 async create(project: ProjectDto, files: Express.Multer.File[]): Promise<Project> {
   const imageUrls = await Promise.all(
     files.map(async (file) => {
       if (process.env.NODE_ENV === 'production') {
         const s3Url = await uploadToS3(file);
         return s3Url || `${this.configService.get('API_URL')}/uploads/${file.filename}`;
       }
       return `${this.configService.get('API_URL')}/uploads/${file.filename}`;
     })
   ).then(urls => urls.filter((url): url is string => url !== null));
   
   const tags = typeof project.tags === 'string'
     ? project.tags.split(',').map(tag => tag.trim())
     : project.tags || [];

   const newProject = this.projectsRepository.create({
     ...project,
     images: imageUrls,
     tags
   });
   return this.projectsRepository.save(newProject);
 }

 async update(id: string, project: ProjectDto, files?: Express.Multer.File[]): Promise<Project> {
   const existingProject = await this.findOne(id);
   
   const newImageUrls = files?.length 
     ? await Promise.all(
         files.map(async (file) => {
           if (process.env.NODE_ENV === 'production') {
             const s3Url = await uploadToS3(file);
             return s3Url || `${this.configService.get('API_URL')}/uploads/${file.filename}`;
           }
           return `${this.configService.get('API_URL')}/uploads/${file.filename}`;
         })
       ).then(urls => urls.filter((url): url is string => url !== null))
     : [];

   const imageUrls = [...existingProject.images, ...newImageUrls];

   const tags = typeof project.tags === 'string'
     ? project.tags.split(',').map(tag => tag.trim())
     : project.tags || existingProject.tags;

   await this.projectsRepository.update(id, {
     ...project,
     images: imageUrls,
     tags
   });

   return this.findOne(id);
 }

 async remove(id: string): Promise<void> {
   const result = await this.projectsRepository.delete(id);
   if (result.affected === 0) {
     throw new NotFoundException(`Project with ID ${id} not found`);
   }
 }
}