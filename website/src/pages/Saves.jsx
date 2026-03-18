import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Heart, BookmarkSimple, Calendar, Clock, MapPin, Lightning, ArrowRight } from '@phosphor-icons/react';
import SEO from '../components/SEO';
import useSavesStore from '../stores/savesStore';
import { blogPosts } from '../data/blogData';
import { projectsData } from '../data/projectsData';

export default function Saves() {
  const { likedBlogs, likedProjects, toggleBlog, toggleProject } = useSavesStore();

  const savedBlogs = blogPosts.filter((p) => likedBlogs.includes(p.slug));
  const savedProjects = projectsData.filter((p) => likedProjects.includes(p.slug));
  const totalSaves = savedBlogs.length + savedProjects.length;

  return (
    <>
      <SEO title="Saved Items" description="Your saved articles and projects." />

      <section className="relative bg-taqon-dark pt-28 pb-12">
        <div className="absolute inset-0 dark-mesh" />
        <div className="relative max-w-7xl mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <span className="text-taqon-orange text-sm font-semibold uppercase tracking-[0.15em]">Your Collection</span>
            <h1 className="mt-3 text-4xl font-bold font-syne text-white">
              Saved <span className="text-gradient">Items</span>
            </h1>
            <p className="mt-3 text-white/50">
              {totalSaves > 0 ? `${totalSaves} saved item${totalSaves !== 1 ? 's' : ''}` : 'Nothing saved yet'}
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-12 lg:py-16 bg-taqon-cream dark:bg-taqon-dark min-h-[50vh]">
        <div className="max-w-7xl mx-auto px-4">

          {totalSaves === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
            >
              <BookmarkSimple size={56} className="text-gray-300 dark:text-white/15 mx-auto mb-4" />
              <h2 className="text-xl font-bold font-syne text-taqon-charcoal dark:text-white mb-2">No saved items yet</h2>
              <p className="text-taqon-muted dark:text-white/40 mb-6">
                Tap the heart icon on articles and projects to save them here.
              </p>
              <div className="flex items-center justify-center gap-3">
                <Link to="/blog" className="px-6 py-3 rounded-xl bg-taqon-orange text-white font-semibold text-sm hover:bg-taqon-orange/90 transition-all">
                  Browse Articles
                </Link>
                <Link to="/projects" className="px-6 py-3 rounded-xl border border-gray-200 dark:border-white/10 text-taqon-charcoal dark:text-white font-semibold text-sm hover:bg-gray-50 dark:hover:bg-white/5 transition-all">
                  View Projects
                </Link>
              </div>
            </motion.div>
          )}

          {/* Saved Articles */}
          {savedBlogs.length > 0 && (
            <div className="mb-12">
              <h2 className="text-xl font-bold font-syne text-taqon-charcoal dark:text-white mb-6 flex items-center gap-2">
                <Heart size={20} className="text-red-500" weight="fill" />
                Saved Articles ({savedBlogs.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {savedBlogs.map((post, i) => (
                  <motion.div
                    key={post.slug}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Link to={`/blog/${post.slug}`} className="group block h-full">
                      <div className="bg-white dark:bg-taqon-charcoal rounded-2xl overflow-hidden border border-gray-100 dark:border-white/10 hover:border-taqon-orange/20 hover:shadow-xl transition-all h-full flex flex-col">
                        <div className="relative aspect-[16/10] overflow-hidden">
                          <img src={post.image} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                          <button
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleBlog(post.slug); }}
                            className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 dark:bg-taqon-dark/90 backdrop-blur-sm flex items-center justify-center hover:scale-110 active:scale-95 transition-all"
                          >
                            <Heart size={18} weight="fill" className="text-red-500" />
                          </button>
                          <span className="absolute top-3 left-3 px-3 py-1 bg-white/90 dark:bg-taqon-dark/90 backdrop-blur-sm text-taqon-orange text-xs font-semibold rounded-full">
                            {post.category}
                          </span>
                        </div>
                        <div className="p-5 flex flex-col flex-1">
                          <h3 className="font-bold font-syne text-taqon-charcoal dark:text-white group-hover:text-taqon-orange transition-colors line-clamp-2">{post.title}</h3>
                          <p className="mt-2 text-sm text-taqon-muted line-clamp-2 flex-1">{post.excerpt}</p>
                          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-white/10 flex items-center gap-3 text-xs text-taqon-muted">
                            <span className="flex items-center gap-1"><Calendar size={12} /> {post.date}</span>
                            <span className="flex items-center gap-1"><Clock size={12} /> {post.readTime}</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Saved Projects */}
          {savedProjects.length > 0 && (
            <div>
              <h2 className="text-xl font-bold font-syne text-taqon-charcoal dark:text-white mb-6 flex items-center gap-2">
                <Heart size={20} className="text-red-500" weight="fill" />
                Saved Projects ({savedProjects.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {savedProjects.map((project, i) => (
                  <motion.div
                    key={project.slug}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Link to={`/projects/${project.slug}`} className="group block h-full">
                      <div className="bg-white dark:bg-taqon-charcoal rounded-2xl overflow-hidden border border-gray-100 dark:border-white/10 hover:border-taqon-orange/20 hover:shadow-xl transition-all h-full flex flex-col">
                        <div className="relative aspect-[16/10] overflow-hidden">
                          <img src={project.heroImage} alt={project.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                          <button
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleProject(project.slug); }}
                            className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 dark:bg-taqon-dark/90 backdrop-blur-sm flex items-center justify-center hover:scale-110 active:scale-95 transition-all"
                          >
                            <Heart size={18} weight="fill" className="text-red-500" />
                          </button>
                          <div className="absolute bottom-3 left-3 flex items-center gap-2">
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-taqon-orange text-white text-xs font-bold">
                              <Lightning size={10} weight="fill" /> {project.kva}
                            </span>
                            <span className="flex items-center gap-1 text-white/80 text-xs">
                              <MapPin size={10} /> {project.location}
                            </span>
                          </div>
                        </div>
                        <div className="p-5 flex flex-col flex-1">
                          <h3 className="font-bold font-syne text-taqon-charcoal dark:text-white group-hover:text-taqon-orange transition-colors line-clamp-2">{project.title}</h3>
                          <p className="mt-2 text-sm text-taqon-muted line-clamp-2 flex-1">{project.description}</p>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

        </div>
      </section>
    </>
  );
}
