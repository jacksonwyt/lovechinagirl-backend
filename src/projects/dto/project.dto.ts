// project.dto.ts
export class CreateProjectDto {
    title: string;
    description: string;
    year: number;
    tags: string | string[];
  }
  
  export class UpdateProjectDto extends CreateProjectDto {
    images?: string[];
  }