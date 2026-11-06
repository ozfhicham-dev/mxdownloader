import { writable } from 'svelte/store';

export type Locale = 'en' | 'es' | 'fr' | 'pt' | 'ar';

export const currentLocale = writable<Locale>('en');

export interface Translations {
  dir: 'ltr' | 'rtl';
  font: string;
  title: string;
  subtitle: string;
  placeholder: string;
  downloadBtn: string;
  processing: string;
  sitemapLink: string;
  allRights: string;
  quality1080: string;
  quality720: string;
  qualityMp3: string;
}

export const I18N: Record<Locale, Translations> = {
  en: {
    dir: 'ltr',
    font: 'font-sans',
    title: 'Download Video & MP3 Audio in Full HD',
    subtitle: 'Fast, free online downloader for Facebook, TikTok, Instagram & YouTube.',
    placeholder: 'Paste video link here (YouTube, TikTok, Facebook, Instagram)...',
    downloadBtn: 'Download',
    processing: 'Processing...',
    sitemapLink: 'Sitemap XML',
    allRights: 'All rights reserved.',
    quality1080: '1080p Full HD',
    quality720: '720p HD',
    qualityMp3: 'Audio MP3 (320kbps)'
  },
  ar: {
    dir: 'rtl',
    font: 'font-amiri',
    title: 'تحميل الفيديو والصوت MP3 بأعلى جودة',
    subtitle: 'أسرع أداة مجانية لتحميل الفيديوهات من فيسبوك وتيك توك وإنستغرام ويوتيوب بدون علامة مائية.',
    placeholder: 'ضع رابط الفيديو هنا (فيسبوك، تيك توك، إنستغرام، يوتيوب)...',
    downloadBtn: 'تحميل الآن',
    processing: 'جاري المعالجة...',
    sitemapLink: 'خريطة الموقع (Sitemap)',
    allRights: 'جميع الحقوق محفوظة.',
    quality1080: 'فيديو بدقة 1080p Full HD',
    quality720: 'فيديو بدقة 720p HD',
    qualityMp3: 'صوت عالي الجودة MP3 (320kbps)'
  },
  fr: {
    dir: 'ltr',
    font: 'font-sans',
    title: 'Télécharger Vidéo et Audio MP3 en Full HD',
    subtitle: 'Téléchargeur en ligne rapide et gratuit pour Facebook, TikTok, Instagram et YouTube.',
    placeholder: 'Collez le lien de la vidéo ici...',
    downloadBtn: 'Télécharger',
    processing: 'Traitement...',
    sitemapLink: 'Plan du site XML',
    allRights: 'Tous droits réservés.',
    quality1080: '1080p Full HD',
    quality720: '720p HD',
    qualityMp3: 'Audio MP3 (320kbps)'
  },
  es: {
    dir: 'ltr',
    font: 'font-sans',
    title: 'Descargar Video y Audio MP3 en Full HD',
    subtitle: 'Descargador en línea rápido y gratuito para Facebook, TikTok, Instagram y YouTube.',
    placeholder: 'Pega el enlace del video aquí...',
    downloadBtn: 'Descargar',
    processing: 'Procesando...',
    sitemapLink: 'Mapa del sitio XML',
    allRights: 'Todos los derechos reservados.',
    quality1080: '1080p Full HD',
    quality720: '720p HD',
    qualityMp3: 'Audio MP3 (320kbps)'
  },
  pt: {
    dir: 'ltr',
    font: 'font-sans',
    title: 'Baixar Vídeo e Áudio MP3 em Full HD',
    subtitle: 'Baixador online rápido e gratuito para Facebook, TikTok, Instagram e YouTube.',
    placeholder: 'Cole o link do vídeo aqui...',
    downloadBtn: 'Baixar',
    processing: 'Processando...',
    sitemapLink: 'Mapa do site XML',
    allRights: 'Todos os direitos reservados.',
    quality1080: '1080p Full HD',
    quality720: '720p HD',
    qualityMp3: 'Áudio MP3 (320kbps)'
  }
};