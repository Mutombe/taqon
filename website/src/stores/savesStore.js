import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useSavesStore = create(
  persist(
    (set, get) => ({
      likedBlogs: [],
      likedProjects: [],
      likedProducts: [],
      likedPackages: [],

      toggleBlog: (slug) => set((s) => ({
        likedBlogs: s.likedBlogs.includes(slug) ? s.likedBlogs.filter((x) => x !== slug) : [...s.likedBlogs, slug],
      })),
      toggleProject: (slug) => set((s) => ({
        likedProjects: s.likedProjects.includes(slug) ? s.likedProjects.filter((x) => x !== slug) : [...s.likedProjects, slug],
      })),
      toggleProduct: (slug) => set((s) => ({
        likedProducts: s.likedProducts.includes(slug) ? s.likedProducts.filter((x) => x !== slug) : [...s.likedProducts, slug],
      })),
      togglePackage: (slug) => set((s) => ({
        likedPackages: s.likedPackages.includes(slug) ? s.likedPackages.filter((x) => x !== slug) : [...s.likedPackages, slug],
      })),
    }),
    { name: 'taqon-saves' }
  )
);

export default useSavesStore;
