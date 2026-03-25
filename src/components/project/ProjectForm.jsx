import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";
import LocationInputGroup from './LocationInputGroup';
import PhotoUploader from './PhotoUploader'; // Assuming this exists
import { supabase } from "../../../lib/customSupabaseClient";

// ... (schema definition remains largely the same, maybe adjusted for new location structure if needed)
const projectSchema = z.object({
  title: z.string().min(5, "Le titre doit contenir au moins 5 caractères"),
  type_projet: z.enum(["achat", "vente"]),
  type_bien: z.string().min(1, "Type de bien requis"),
  description: z.string().optional(),
  budget_max: z.string().optional(), // We'll parse to number on submit
  surface_min: z.string().optional(),
  bedrooms_min: z.string().optional(),
  // ... other fields
});

const ProjectForm = ({ initialData, onSubmit, isEdit }) => {
  const { toast } = useToast();
  const [locations, setLocations] = useState(initialData?.locations || [{ id: Date.now(), city: '', quartier: '' }]);
  const [photos, setPhotos] = useState(initialData?.photos || []);
  const [loading, setLoading] = useState(false);

  const form = useForm({
    resolver: zodResolver(projectSchema),
    defaultValues: initialData || {
      type_projet: 'achat',
      type_bien: 'appartement',
      // ... defaults
    }
  });

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      // 1. Upload photos if any new ones
      // ... (photo upload logic using supabase storage)

      // 2. Prepare payload
      const payload = {
        ...values,
        locations: locations, // Use the state locations
        // ... map other fields
      };

      await onSubmit(payload);
      
    } catch (error) {
      console.error("Form submission error:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Une erreur est survenue lors de l'enregistrement."
      });
    } finally {
      setLoading(false);
    }
  };

  // ... (render form fields)

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        {/* ... basic fields ... */}

        <LocationInputGroup 
          locations={locations}
          onChange={setLocations}
          onAdd={() => setLocations([...locations, { id: Date.now(), city: '' }])}
          onRemove={(index) => setLocations(locations.filter((_, i) => i !== index))}
        />

        {/* ... photos, other fields ... */}

        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEdit ? "Mettre à jour" : "Créer le projet"}
        </Button>
      </form>
    </Form>
  );
};

ProjectForm.propTypes = {
  initialData: PropTypes.object,
  onSubmit: PropTypes.func.isRequired,
  isEdit: PropTypes.bool
};

export default ProjectForm;