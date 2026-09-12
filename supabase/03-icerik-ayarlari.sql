-- =====================================================================
-- SahaBizim — site içeriği ayarları
-- 01 ve 02 çalıştırıldıktan sonra SQL Editor'da çalıştır.
-- Bu satırlar sayesinde anasayfa ve diğer sayfaların metinleri
-- yönetim panelindeki "Ayarlar" sekmesinden değiştirilebilir.
-- =====================================================================

insert into ayarlar (anahtar, deger, aciklama) values
  ('hero_baslik',      'Sahada birlik,',                                                            'Anasayfa · ana başlık (birinci satır)'),
  ('hero_vurgu',       'sporda özgürlük',                                                           'Anasayfa · ana başlık (yeşil ikinci satır)'),
  ('hero_metin',       'SahaBizim Ligi''nin puan durumu, fikstürü ve haftanın maçları tek yerde. Takımını kur, maçını ayarla, gerisini sahaya bırak.', 'Anasayfa · başlık altı açıklama'),
  ('hero_buton1',      'Puan Durumu',                                                               'Anasayfa · birinci buton yazısı'),
  ('hero_buton2',      'Takımını Kaydet',                                                           'Anasayfa · ikinci buton yazısı'),

  ('kampanya_baslik',  'Spor hayattır,',                                                            'Anasayfa · kampanya bandı başlığı (birinci satır)'),
  ('kampanya_vurgu',   'bağımlılık değil',                                                          'Anasayfa · kampanya bandı başlığı (altın ikinci satır)'),
  ('kampanya_metin',   'Sahada geçen her dakika, kaybedilmeyen bir dakikadır. Gençleri madde ve alkol bağımlılığına karşı sahaya çağırıyoruz — tribünde değil, oyunun içinde.', 'Anasayfa · kampanya bandı metni'),
  ('kampanya_buton',   'Sahaya Katıl',                                                              'Anasayfa · kampanya bandı buton yazısı'),

  ('katil_baslik',     'Takımını lige yaz',                                                         'Katıl sayfası · başlık'),
  ('katil_metin',      'Formu doldur, WhatsApp''tan bize ulaşsın. Aynı gün içinde dönüş yapıyoruz: fikstür, saha ve ödeme detaylarını orada konuşuyoruz.', 'Katıl sayfası · açıklama'),
  ('katil_maddeler',   'Takım başına sezonluk tek kayıt' || chr(10) || 'Maçlar hafta içi akşam ve hafta sonu' || chr(10) || 'Skorlar girildiği anda puan durumuna işler' || chr(10) || 'Takımının kendi sayfası ve istatistikleri olur', 'Katıl sayfası · madde listesi (her satır bir madde)'),

  ('iletisim_metin',   'Lig, maç programı veya saha ile ilgili her konuda yazabilirsin.',            'İletişim sayfası · açıklama'),
  ('galeri_metin',     'Maç kareleri panelden yüklendikçe bu sayfa albümlere ayrılacak.',            'Galeri sayfası · açıklama'),
  ('footer_metin',     'Sporu sadece bir oyun değil, bir yaşam biçimi olarak görenlerin sahası.',    'Alt bilgi · kısa tanıtım metni'),
  ('site_aciklama',    'SahaBizim Ligi''nin güncel puan durumu, fikstürü ve haftanın maçları.',      'Google araması için site açıklaması')
on conflict (anahtar) do nothing;
