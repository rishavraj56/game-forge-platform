'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-field';
import { cn } from '@/lib/utils';

export interface Project {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  projectUrl?: string;
  githubUrl?: string;
  technologies: string[];
  featured: boolean;
  createdAt: Date;
}

interface PortfolioSectionProps {
  projects: Project[];
  onAddProject: (project: Omit<Project, 'id' | 'createdAt'>) => void;
  onUpdateProject: (id: string, project: Omit<Project, 'id' | 'createdAt'>) => void;
  onDeleteProject: (id: string) => void;
  isEditing?: boolean;
  className?: string;
}

export function PortfolioSection({
  projects,
  onAddProject,
  onUpdateProject,
  onDeleteProject,
  isEditing = false,
  className
}: PortfolioSectionProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProject, setEditingProject] = useState<string | null>(null);

  const featuredProjects = projects.filter(p => p.featured);
  const otherProjects = projects.filter(p => !p.featured);

  return (
    <Card className={cn('p-6', className)}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Portfolio</h3>
          {isEditing && (
            <Button
              onClick={() => setShowAddForm(true)}
              size="sm"
            >
              Add Project
            </Button>
          )}
        </div>

        {/* Add Project Form */}
        {showAddForm && (
          <ProjectForm
            onSave={(project) => {
              onAddProject(project);
              setShowAddForm(false);
            }}
            onCancel={() => setShowAddForm(false)}
          />
        )}

        {/* Featured Projects */}
        {featuredProjects.length > 0 && (
          <div>
            <h4 className="text-md font-medium text-gray-800 mb-3">Featured Projects</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {featuredProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  isEditing={isEditing}
                  isEditingThis={editingProject === project.id}
                  onEdit={() => setEditingProject(project.id)}
                  onSave={(updatedProject) => {
                    onUpdateProject(project.id, updatedProject);
                    setEditingProject(null);
                  }}
                  onCancel={() => setEditingProject(null)}
                  onDelete={() => onDeleteProject(project.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Other Projects */}
        {otherProjects.length > 0 && (
          <div>
            <h4 className="text-md font-medium text-gray-800 mb-3">
              {featuredProjects.length > 0 ? 'Other Projects' : 'Projects'}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {otherProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  isEditing={isEditing}
                  isEditingThis={editingProject === project.id}
                  onEdit={() => setEditingProject(project.id)}
                  onSave={(updatedProject) => {
                    onUpdateProject(project.id, updatedProject);
                    setEditingProject(null);
                  }}
                  onCancel={() => setEditingProject(null)}
                  onDelete={() => onDeleteProject(project.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {projects.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No projects yet</h3>
            <p className="text-gray-600 mb-4">Showcase your game development projects to the community</p>
            {isEditing && (
              <Button onClick={() => setShowAddForm(true)}>
                Add Your First Project
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

interface ProjectCardProps {
  project: Project;
  isEditing: boolean;
  isEditingThis: boolean;
  onEdit: () => void;
  onSave: (project: Omit<Project, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
  onDelete: () => void;
}

function ProjectCard({
  project,
  isEditing,
  isEditingThis,
  onEdit,
  onSave,
  onCancel,
  onDelete
}: ProjectCardProps) {
  if (isEditingThis) {
    return (
      <ProjectForm
        project={project}
        onSave={onSave}
        onCancel={onCancel}
      />
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
      {project.imageUrl && (
        <div className="aspect-video bg-gray-100">
          <img
            src={project.imageUrl}
            alt={project.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h4 className="font-semibold text-gray-900 line-clamp-1">{project.title}</h4>
          {project.featured && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              Featured
            </span>
          )}
        </div>
        
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{project.description}</p>
        
        {project.technologies.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {project.technologies.slice(0, 3).map((tech) => (
              <span
                key={tech}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
              >
                {tech}
              </span>
            ))}
            {project.technologies.length > 3 && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                +{project.technologies.length - 3}
              </span>
            )}
          </div>
        )}
        
        <div className="flex items-center justify-between">
          <div className="flex space-x-2">
            {project.projectUrl && (
              <a
                href={project.projectUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                View Project
              </a>
            )}
            {project.githubUrl && (
              <a
                href={project.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-gray-800 text-sm font-medium"
              >
                GitHub
              </a>
            )}
          </div>
          
          {isEditing && (
            <div className="flex space-x-1">
              <button
                onClick={onEdit}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button
                onClick={onDelete}
                className="p-1 text-gray-400 hover:text-red-600"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface ProjectFormProps {
  project?: Project;
  onSave: (project: Omit<Project, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
}

function ProjectForm({ project, onSave, onCancel }: ProjectFormProps) {
  const [formData, setFormData] = useState({
    title: project?.title || '',
    description: project?.description || '',
    imageUrl: project?.imageUrl || '',
    projectUrl: project?.projectUrl || '',
    githubUrl: project?.githubUrl || '',
    technologies: project?.technologies.join(', ') || '',
    featured: project?.featured || false
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors: Record<string, string> = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length === 0) {
      const projectData = {
        title: formData.title,
        description: formData.description,
        imageUrl: formData.imageUrl || undefined,
        projectUrl: formData.projectUrl || undefined,
        githubUrl: formData.githubUrl || undefined,
        technologies: formData.technologies
          .split(',')
          .map(tech => tech.trim())
          .filter(tech => tech.length > 0),
        featured: formData.featured
      };
      onSave(projectData);
    }
  };

  return (
    <Card className="p-4 border-2 border-blue-200">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-medium text-gray-900">
            {project ? 'Edit Project' : 'Add New Project'}
          </h4>
        </div>

        <FormField label="Project Title" error={errors.title} required>
          <Input
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            placeholder="Enter project title"
          />
        </FormField>

        <FormField label="Description" error={errors.description} required>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Describe your project..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
          />
        </FormField>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Project URL">
            <Input
              value={formData.projectUrl}
              onChange={(e) => setFormData(prev => ({ ...prev, projectUrl: e.target.value }))}
              placeholder="https://..."
            />
          </FormField>

          <FormField label="GitHub URL">
            <Input
              value={formData.githubUrl}
              onChange={(e) => setFormData(prev => ({ ...prev, githubUrl: e.target.value }))}
              placeholder="https://github.com/..."
            />
          </FormField>
        </div>

        <FormField label="Technologies" description="Separate multiple technologies with commas">
          <Input
            value={formData.technologies}
            onChange={(e) => setFormData(prev => ({ ...prev, technologies: e.target.value }))}
            placeholder="Unity, C#, Blender, etc."
          />
        </FormField>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="featured"
            checked={formData.featured}
            onChange={(e) => setFormData(prev => ({ ...prev, featured: e.target.checked }))}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="featured" className="ml-2 block text-sm text-gray-900">
            Feature this project
          </label>
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">
            {project ? 'Update Project' : 'Add Project'}
          </Button>
        </div>
      </form>
    </Card>
  );
}