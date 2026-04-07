import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { BlogPost } from "@/lib/types/database";

const supabase = createClient();

export function useBlogPosts(storeId: string | undefined) {
  return useQuery({
    queryKey: ["blog-posts", storeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("store_id", storeId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as BlogPost[];
    },
    enabled: !!storeId,
  });
}

export function usePublicBlogPosts(storeId: string | undefined) {
  return useQuery({
    queryKey: ["public-blog-posts", storeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("store_id", storeId!)
        .eq("is_published", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as BlogPost[];
    },
    enabled: !!storeId,
  });
}

export function useBlogPost(storeId: string | undefined, postSlug: string) {
  return useQuery({
    queryKey: ["blog-post", storeId, postSlug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("store_id", storeId!)
        .eq("slug", postSlug)
        .eq("is_published", true)
        .single();
      if (error) throw error;
      return data as unknown as BlogPost;
    },
    enabled: !!storeId,
  });
}

export function useCreateBlogPost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      store_id: string;
      title: string;
      slug: string;
      content: BlogPost["content"];
      cover_image?: string | null;
      is_published?: boolean;
    }) => {
      const { data, error } = await supabase
        .from("blog_posts")
        .insert(input as never)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as BlogPost;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blog-posts"] });
    },
  });
}

export function useUpdateBlogPost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<BlogPost> & { id: string }) => {
      const { data, error } = await supabase
        .from("blog_posts")
        .update(updates as never)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as BlogPost;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blog-posts"] });
      queryClient.invalidateQueries({ queryKey: ["public-blog-posts"] });
      queryClient.invalidateQueries({ queryKey: ["blog-post"] });
    },
  });
}

export function useDeleteBlogPost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("blog_posts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blog-posts"] });
      queryClient.invalidateQueries({ queryKey: ["public-blog-posts"] });
    },
  });
}
