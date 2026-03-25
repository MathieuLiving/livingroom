import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Loader2,
  Plus,
  Search,
  Trash2,
  Edit,
  Copy,
  Image as ImageIcon,
  UploadCloud,
  Filter,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const BUCKET_NAME = 'professional-assets';
const STORAGE_PATH_PREFIX = 'website';

export default function AdminWebsitePicturesPage() {
  const { toast } = useToast();
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPage, setSelectedPage] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingImage, setEditingImage] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    page_name: '',
    picture_id: '',
    picture_name: '',
    category: '',
    ratio: '',
    tags: '',
    description: '',
    file: null,
  });

  // Unique pages for filter
  const uniquePages = [...new Set(images.map((img) => img.page_name).filter(Boolean))];

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('picture_website')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setImages(data || []);
    } catch (error) {
      console.error('Error fetching images:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les images.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFormData((prev) => ({ ...prev, file: e.target.files[0] }));
    }
  };

  const handleEditClick = (image) => {
    setEditingImage(image);
    setFormData({
      page_name: image.page_name || '',
      picture_id: image.picture_id || '',
      picture_name: image.picture_name || '',
      category: image.metadata?.category || '',
      ratio: image.metadata?.ratio || '',
      tags: Array.isArray(image.metadata?.tags) ? image.metadata.tags.join(', ') : '',
      description: image.metadata?.description || '',
      file: null,
    });
    setIsDialogOpen(true);
  };

  const handleAddNewClick = () => {
    setEditingImage(null);
    setFormData({
      page_name: '',
      picture_id: '',
      picture_name: '',
      category: '',
      ratio: '',
      tags: '',
      description: '',
      file: null,
    });
    setIsDialogOpen(true);
  };

  const processSubmit = async (e) => {
    e.preventDefault();
    if (!formData.page_name || !formData.picture_id) {
      toast({
        title: 'Champs manquants',
        description: 'Le nom de la page et l\'ID de l\'image sont obligatoires.',
        variant: 'destructive',
      });
      return;
    }

    if (!editingImage && !formData.file) {
      toast({
        title: 'Fichier manquant',
        description: 'Veuillez sélectionner une image à uploader.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setUploading(true);
      let publicUrl = editingImage?.picture_url;

      // 1. Upload File if present
      if (formData.file) {
        const fileExt = formData.file.name.split('.').pop();
        const fileName = `${formData.picture_id}_${Date.now()}.${fileExt}`;
        const filePath = `${STORAGE_PATH_PREFIX}/${formData.page_name}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from(BUCKET_NAME)
          .upload(filePath, formData.file);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from(BUCKET_NAME)
          .getPublicUrl(filePath);
        
        publicUrl = urlData.publicUrl;

        // Clean up old file if replacing
        if (editingImage && editingImage.picture_url) {
          const oldPath = editingImage.picture_url.split(`${BUCKET_NAME}/`).pop();
          if (oldPath) {
            await supabase.storage.from(BUCKET_NAME).remove([oldPath]);
          }
        }
      }

      // 2. Upsert Database Record
      const payload = {
        page_name: formData.page_name,
        picture_id: formData.picture_id,
        picture_name: formData.picture_name,
        picture_url: publicUrl,
        user_id: (await supabase.auth.getUser()).data.user?.id,
        metadata: {
          category: formData.category,
          ratio: formData.ratio,
          description: formData.description,
          tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
        },
        updated_at: new Date().toISOString(),
      };

      if (!editingImage) {
        payload.created_at = new Date().toISOString();
      } else {
        payload.id = editingImage.id;
      }

      const { error: dbError } = await supabase
        .from('picture_website')
        .upsert(payload);

      if (dbError) throw dbError;

      toast({
        title: editingImage ? 'Image mise à jour' : 'Image ajoutée',
        description: 'L\'opération a été effectuée avec succès.',
      });

      setIsDialogOpen(false);
      fetchImages();
    } catch (error) {
      console.error('Error saving image:', error);
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors de l\'enregistrement.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (image) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette image ?')) return;

    try {
      setLoading(true);
      
      // 1. Delete from Storage
      if (image.picture_url) {
        const path = image.picture_url.split(`${BUCKET_NAME}/`).pop();
        if (path) {
          await supabase.storage.from(BUCKET_NAME).remove([path]);
        }
      }

      // 2. Delete from DB
      const { error } = await supabase
        .from('picture_website')
        .delete()
        .eq('id', image.id);

      if (error) throw error;

      toast({
        title: 'Image supprimée',
        description: 'L\'image a été supprimée définitivement.',
      });
      fetchImages();
    } catch (error) {
      console.error('Error deleting image:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer l\'image.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copié !',
      description: 'L\'URL a été copiée dans le presse-papier.',
    });
  };

  const filteredImages = images.filter((img) => {
    const matchesSearch =
      img.picture_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      img.picture_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      img.page_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      img.metadata?.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesPage = selectedPage === 'all' || img.page_name === selectedPage;

    return matchesSearch && matchesPage;
  });

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <Card className="mb-8 border-none shadow-sm bg-white/50 backdrop-blur-sm">
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2">
          <div>
            <CardTitle className="text-2xl font-bold flex items-center gap-2">
              <ImageIcon className="h-6 w-6 text-primary" />
              Médiathèque Site
            </CardTitle>
            <p className="text-muted-foreground text-sm mt-1">
              Gérez les images utilisées sur les différentes pages du site public.
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleAddNewClick} className="gap-2">
                <Plus className="h-4 w-4" /> Ajouter une image
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingImage ? 'Modifier l\'image' : 'Nouvelle image'}</DialogTitle>
                <DialogDescription>
                  Remplissez les informations ci-dessous. Le fichier est stocké dans le bucket <code>{BUCKET_NAME}</code>.
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={processSubmit} className="space-y-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="page_name">Page *</Label>
                    <Input
                      id="page_name"
                      name="page_name"
                      placeholder="ex: home, blog, contact"
                      value={formData.page_name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="picture_id">ID Unique (Slug) *</Label>
                    <Input
                      id="picture_id"
                      name="picture_id"
                      placeholder="ex: hero-banner-v2"
                      value={formData.picture_id}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="picture_name">Nom d'affichage</Label>
                  <Input
                    id="picture_name"
                    name="picture_name"
                    placeholder="Titre descriptif de l'image"
                    value={formData.picture_name}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Catégorie</Label>
                    <Select 
                      value={formData.category} 
                      onValueChange={(val) => setFormData(prev => ({...prev, category: val}))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">Général</SelectItem>
                        <SelectItem value="immobilier">Immobilier</SelectItem>
                        <SelectItem value="illustration">Illustration</SelectItem>
                        <SelectItem value="icon">Icône</SelectItem>
                        <SelectItem value="team">Équipe</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ratio">Format / Ratio</Label>
                    <Input
                      id="ratio"
                      name="ratio"
                      placeholder="ex: 16:9, 1:1, auto"
                      value={formData.ratio}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tags">Tags (séparés par des virgules)</Label>
                  <Input
                    id="tags"
                    name="tags"
                    placeholder="moderne, lumineux, extérieur..."
                    value={formData.tags}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description (Alt text)</Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Description pour l'accessibilité et le SEO"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="file">Fichier Image {editingImage && '(Laisser vide pour conserver l\'actuel)'}</Label>
                  <div className="flex items-center gap-4">
                    <Input
                      id="file"
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="cursor-pointer"
                    />
                  </div>
                  {editingImage && !formData.file && (
                    <div className="mt-2 text-sm text-muted-foreground flex items-center gap-2">
                      <ImageIcon className="h-4 w-4" />
                      Image actuelle conservée
                    </div>
                  )}
                </div>

                <DialogFooter className="pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Annuler
                  </Button>
                  <Button type="submit" disabled={uploading}>
                    {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {editingImage ? 'Mettre à jour' : 'Uploader'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom, ID ou tag..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="w-full md:w-[200px]">
              <Select value={selectedPage} onValueChange={setSelectedPage}>
                <SelectTrigger>
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <SelectValue placeholder="Filtrer par page" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les pages</SelectItem>
                  {uniquePages.map(page => (
                    <SelectItem key={page} value={page}>{page}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button variant="ghost" size="icon" onClick={fetchImages} title="Rafraîchir">
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Aperçu</TableHead>
                  <TableHead>Info</TableHead>
                  <TableHead>Contexte</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      <div className="flex justify-center items-center gap-2 text-muted-foreground">
                        <Loader2 className="h-5 w-5 animate-spin" /> Chargement...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredImages.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                      Aucune image trouvée.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredImages.map((image) => (
                    <TableRow key={image.id}>
                      <TableCell>
                        <div className="h-16 w-24 relative rounded overflow-hidden bg-gray-100 border">
                          <img
                            src={image.picture_url}
                            alt={image.picture_name}
                            className="object-cover w-full h-full"
                            onError={(e) => { e.target.src = 'https://via.placeholder.com/150?text=Error'; }}
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span className="font-medium text-sm">{image.picture_name || 'Sans nom'}</span>
                          <code className="text-xs bg-muted px-1 py-0.5 rounded w-fit text-muted-foreground">
                            {image.picture_id}
                          </code>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <Badge variant="outline" className="w-fit">{image.page_name}</Badge>
                          {image.metadata?.category && (
                            <span className="text-xs text-muted-foreground capitalize">
                              {image.metadata.category}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {Array.isArray(image.metadata?.tags) && image.metadata.tags.map((tag, idx) => (
                            <span key={idx} className="text-[10px] bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded-full">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => copyToClipboard(image.picture_url)}
                            title="Copier URL"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            asChild
                            title="Ouvrir"
                          >
                            <a href={image.picture_url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditClick(image)}
                            title="Modifier"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(image)}
                            className="text-destructive hover:text-destructive"
                            title="Supprimer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}