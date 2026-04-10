import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/types/database";

const supabase = createClient();

export function useProfile() {
  const queryClient = useQueryClient();
  const subscribed = useRef(false);

  // Invalidate profile cache when auth state changes (login/logout)
  useEffect(() => {
    if (subscribed.current) return;
    subscribed.current = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      // Debounce: only invalidate, React Query will refetch
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    });
    return () => {
      subscription.unsubscribe();
      subscribed.current = false;
    };
  }, [queryClient]);

  return useQuery({
    queryKey: ["profile"],
    staleTime: 1000 * 60 * 5,
    queryFn: async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) return null;

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      if (error) throw error;
      return data as unknown as Profile;
    },
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: Partial<Profile>) => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) throw new Error("Не авторизован");

      const { data, error } = await supabase
        .from("profiles")
        .update(updates as never)
        .eq("id", session.user.id)
        .select()
        .single();

      if (error) throw error;
      return data as unknown as Profile;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });
}
