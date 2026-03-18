import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Saves/Likes store — persists to localStorage.
 * Works without authentication. Stores slugs of liked items.
 */
const useSavesStore = create(
  persist(
    (set, get) => ({
      likedBlogs: [],    // array of blog slugs
      likedProjects: [], // array of project slugs

      toggleBlog: (slug) => set((state) => ({
        likedBlogs: state.likedBlogs.includes(slug)
          ? state.likedBlogs.filter((s) => s !== slug)
          : [...state.likedBlogs, slug],
      })),

      toggleProject: (slug) => set((state) => ({
        likedProjects: state.likedProjects.includes(slug)
          ? state.likedProjects.filter((s) => s !== slug)
          : [...state.likedProjects, slug],
      })),

      isBlogLiked: (slug) => get().likedBlogs.includes(slug),
      isProjectLiked: (slug) => get().likedProjects.includes(slug),

      totalSaves: () => get().likedBlogs.length + get().likedProjects.length,
    }),
    {
      name: 'taqon-saves',
    }
  )
);

export default useSavesStore;
