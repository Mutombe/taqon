import { motion } from 'framer-motion';
import {
  Question, FilePdf, YoutubeLogo, SolarPanel, Buildings, Article,
  ChatCircle, Plus, PencilSimple, Trash, FloppyDisk, Eye, UploadSimple, Info,
} from '@phosphor-icons/react';
import SEO from '../../components/SEO';

/* One documented area of the dashboard. */
function Section({ icon: Icon, title, where, children }) {
  return (
    <div className="bg-white dark:bg-taqon-charcoal rounded-2xl border border-gray-100 dark:border-white/10 p-6 shadow-sm dark:shadow-none">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-11 h-11 rounded-xl bg-taqon-orange/10 flex items-center justify-center flex-shrink-0">
          <Icon size={22} className="text-taqon-orange" weight="duotone" />
        </div>
        <div className="min-w-0">
          <h2 className="text-lg font-bold font-syne text-taqon-charcoal dark:text-white">{title}</h2>
          {where && <p className="text-xs text-taqon-orange font-medium mt-0.5">{where}</p>}
        </div>
      </div>
      <div className="space-y-2.5 text-sm text-taqon-charcoal/80 dark:text-white/70 leading-relaxed">
        {children}
      </div>
    </div>
  );
}

/* A single labelled instruction line (Create / Edit / Delete …). */
function Do({ verb, icon: Icon, children }) {
  return (
    <div className="flex gap-2.5">
      <span className="inline-flex items-center gap-1 flex-shrink-0 text-xs font-bold uppercase tracking-wide text-taqon-orange w-16">
        {Icon && <Icon size={13} weight="bold" />} {verb}
      </span>
      <span className="min-w-0">{children}</span>
    </div>
  );
}

export default function AdminGuide() {
  return (
    <div className="space-y-6 max-w-5xl">
      <SEO title="How-To Guide · Admin" noindex />
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold font-syne text-taqon-charcoal dark:text-white">How-To Guide</h1>
        <p className="text-sm text-taqon-muted dark:text-white/50 mt-1">
          Step-by-step instructions for managing everything on the site — adding, editing and deleting (CRUD).
        </p>
      </motion.div>

      {/* General */}
      <div className="rounded-2xl border border-taqon-orange/20 bg-taqon-orange/[0.04] p-5 text-sm text-taqon-charcoal/80 dark:text-white/70">
        <div className="flex items-center gap-2 font-semibold text-taqon-charcoal dark:text-white mb-2">
          <Info size={16} className="text-taqon-orange" /> A few things that apply everywhere
        </div>
        <ul className="list-disc pl-5 space-y-1">
          <li><b>Save buttons</b> stay disabled until you actually change something — if a Save button is greyed out, there are no unsaved edits.</li>
          <li><b>Deleting</b> always asks you to confirm first, and can’t be undone.</li>
          <li><b>Images and files</b> you upload are stored in the cloud automatically — no need to touch anything else.</li>
          <li>Changes go <b>live on the website within a minute</b> (some cached items like brochures can take a little longer).</li>
        </ul>
      </div>

      {/* Company Profile */}
      <Section icon={FilePdf} title="Company Profile" where="Content → Site Content → Company Profile">
        <p>The PDF served by the “Download Company Profile” buttons on the Contact and About pages.</p>
        <Do verb="Add" icon={UploadSimple}>Choose a PDF (up to 50 MB) and click <b>Upload file</b>.</Do>
        <Do verb="Edit" icon={UploadSimple}>Upload a new PDF and click <b>Replace file</b> — it swaps the old one.</Do>
        <Do verb="View">Click <b>View current</b> to download exactly what visitors get.</Do>
        <Do verb="Delete" icon={Trash}>Click <b>Remove</b>. The download buttons then hide on the site until you upload a new file.</Do>
      </Section>

      {/* Video Stories */}
      <Section icon={YoutubeLogo} title="Video Stories" where="Content → Site Content → Video Stories">
        <p>The “Solar Insights &amp; Guides” videos shown on the Home page and Solar Secrets page.</p>
        <Do verb="Add" icon={Plus}>Type a <b>title</b> and paste a <b>YouTube link</b> in the top row, then click <b>Add</b>. The thumbnail is pulled in automatically.</Do>
        <Do verb="Edit" icon={PencilSimple}>Change the title, link or label in a video’s row, then click <b>Save</b> on that row.</Do>
        <Do verb="Order">Change the <b>Order</b> number (lower shows first) and Save.</Do>
        <Do verb="Hide" icon={Eye}>Click <b>Visible / Hidden</b> to show or hide a video without deleting it, then Save.</Do>
        <Do verb="Delete" icon={Trash}>Click <b>Remove</b> on the video’s row.</Do>
      </Section>

      {/* Package & Advisor Guides */}
      <Section icon={SolarPanel} title="Package & Advisor Guides" where="Content → Site Content → Package Guides">
        <p>Short YouTube guide videos shown on the Packages page, each package family page, and the Solar Advisor.</p>
        <Do verb="Set" icon={PencilSimple}>Paste a YouTube link into a field: <b>Overview guide</b> (Packages page), <b>Solar Advisor guide</b>, or a specific <b>family</b>.</Do>
        <Do verb="Save" icon={FloppyDisk}>Click <b>Save guides</b> to apply all changes at once.</Do>
        <Do verb="Delete" icon={Trash}>Clear a field (the <b>×</b> button) and Save — that guide then shows a clean “Video coming soon” instead.</Do>
      </Section>

      {/* Projects */}
      <Section icon={Buildings} title="Projects" where="Content → Projects">
        <p>The installation gallery shown on the public Projects page.</p>
        <Do verb="Add" icon={Plus}>Click <b>New Project</b> — it opens the editor. Fill in the title, category, location, kVA, date, descriptions, specs (one <i>key: value</i> per line) and benefits (one per line).</Do>
        <Do verb="Images" icon={UploadSimple}>In the editor, upload a <b>Hero image</b> and add <b>Gallery images</b> (each can have a caption). Remove any image with its trash icon.</Do>
        <Do verb="Edit" icon={PencilSimple}>Click the <b>pencil</b> on a project to reopen the editor; click <b>Save</b> when done.</Do>
        <Do verb="Publish" icon={Eye}>Use the <b>eye</b> icon to publish/unpublish, and the <b>star</b> to feature a project. New projects start unpublished (“Draft”).</Do>
        <Do verb="Order">Set the <b>Order</b> in the editor to arrange them (lower shows first).</Do>
        <Do verb="CTA">In the editor, choose the <b>CTA button</b> shown at the bottom of the project page — WhatsApp Us, Contact Us, Get a Free Quote, etc., or a <b>Custom</b> label + link.</Do>
        <Do verb="Delete" icon={Trash}>Click the <b>trash</b> icon on a project.</Do>
      </Section>

      {/* Blog */}
      <Section icon={Article} title="Blog Posts (Solar Secrets)" where="Content → Blog Posts">
        <Do verb="Add" icon={Plus}>Click <b>New Post</b>, write the title and content, add a cover image, then <b>Publish</b> (or <b>Save Draft</b> to finish later).</Do>
        <Do verb="CTA">In the editor sidebar, choose the <b>CTA Button</b> shown at the bottom of the article — WhatsApp Us, Contact Us, Get a Free Quote, etc., or <b>Custom</b> with your own label and link. A live preview updates as you pick.</Do>
        <Do verb="Edit" icon={PencilSimple}>Open a post from the list and edit it, then Publish/Save.</Do>
        <Do verb="Delete" icon={Trash}>Use the delete action on the post.</Do>
      </Section>

      {/* Inquiries */}
      <Section icon={ChatCircle} title="Messages & Inquiries" where="People → Inquiries">
        <p>Everything customers send lands here — the Contact page “Send Us a Message” form (shown as source <b>“Contact page form”</b>) and the Solar Advisor / quote requests. You also get an email for each one.</p>
        <Do verb="View">Open <b>Inquiries</b> to read messages, see contact details, and update their status.</Do>
        <Do verb="Note">Submissions made by internal/admin accounts are intentionally not recorded — test the form from a logged-out browser with an outside email to see it arrive.</Do>
      </Section>

      <p className="text-xs text-taqon-muted dark:text-white/40 text-center pt-2">
        Something not covered here or not working as described? It can be added — just ask.
      </p>
    </div>
  );
}
