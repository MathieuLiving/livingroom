import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import ProjectForm from '@/components/project/ProjectForm';
import { useLocation } from '@/hooks/useLocation.js';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { Checkbox } from '../ui/checkbox';
import { Label } from '../ui/label';

const ProjectModal = ({ isOpen, setIsOpen, project, setProject, onSubmit, loading, isDuplicating = false }) => {
    
    const locationHook = useLocation(project, setProject);

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        await onSubmit();
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-[600px]">
                 <DialogHeader>
                    <DialogTitle>{project?.id && !isDuplicating ? 'Modifier le Projet' : 'Nouveau Projet Immobilier'}</DialogTitle>
                    <DialogDescription>
                        Remplissez les informations ci-dessous pour {project?.id && !isDuplicating ? 'mettre à jour votre' : 'créer un nouveau'} projet.
                    </DialogDescription>
                </DialogHeader>
                 <form onSubmit={handleFormSubmit}>
                    <div className="py-4 max-h-[70vh] overflow-y-auto px-2 space-y-8">
                        <ProjectForm
                            formData={project}
                            setFormData={setProject}
                            loading={loading}
                            locationHook={locationHook}
                            images={project?.images || []}
                            setImages={(images) => setProject(p => ({ ...p, images }))}
                        />
                        <div className="space-y-4">
                            <h3 className="text-lg font-medium text-gray-800">Visibilité du Projet</h3>
                            <div className="flex items-center space-x-3 p-3 rounded-md border border-gray-200 hover:bg-gray-50 transition-colors">
                                <Checkbox
                                    id="visibility_public"
                                    checked={!!project?.visibility_public}
                                    onCheckedChange={(checked) => setProject(p => ({ ...p, visibility_public: checked }))}
                                />
                                <Label htmlFor="visibility_public" className="text-sm font-medium leading-none cursor-pointer flex-grow">
                                    Rendre visibla sur la Place des Projets
                                </Label>
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-end pt-6 border-t mt-4">
                        <Button type="submit" disabled={loading} className="w-full sm:w-auto bg-brand-orange hover:bg-orange-600">
                             {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                             {loading ? (project?.id && !isDuplicating ? 'Mise à jour...' : 'Création...') : (project?.id && !isDuplicating ? 'Sauvegarder' : 'Créer le projet')}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default ProjectModal;