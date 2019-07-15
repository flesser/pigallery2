import {AuthenticationMWs} from '../middlewares/user/AuthenticationMWs';
import {Express} from 'express';
import {GalleryMWs} from '../middlewares/GalleryMWs';
import {RenderingMWs} from '../middlewares/RenderingMWs';
import {ThumbnailGeneratorMWs} from '../middlewares/thumbnail/ThumbnailGeneratorMWs';
import {UserRoles} from '../../common/entities/UserDTO';
import {ThumbnailSourceType} from '../model/threading/ThumbnailWorker';
import {VersionMWs} from '../middlewares/VersionMWs';

export class GalleryRouter {
  public static route(app: Express) {

    this.addGetImageIcon(app);
    this.addGetVideoIcon(app);
    this.addGetImageThumbnail(app);
    this.addGetVideoThumbnail(app);
    this.addGetImage(app);
    this.addGetVideo(app);
    this.addGetMetaFile(app);
    this.addRandom(app);
    this.addDirectoryList(app);

    this.addTrashImage(app);

    this.addSearch(app);
    this.addInstantSearch(app);
    this.addAutoComplete(app);
  }

  private static addDirectoryList(app: Express) {
    app.get(['/api/gallery/content/:directory(*)', '/api/gallery/', '/api/gallery//'],
      AuthenticationMWs.authenticate,
      AuthenticationMWs.normalizePathParam('directory'),
      AuthenticationMWs.authorisePath('directory', true),
      VersionMWs.injectGalleryVersion,
      GalleryMWs.listDirectory,
      ThumbnailGeneratorMWs.addThumbnailInformation,
      GalleryMWs.cleanUpGalleryResults,
      RenderingMWs.renderResult
    );
  }


  private static addGetImage(app: Express) {
    app.get(['/api/gallery/content/:mediaPath(*\.(jpg|jpeg|jpe|webp|png|gif|svg))'],
      AuthenticationMWs.authenticate,
      AuthenticationMWs.normalizePathParam('mediaPath'),
      AuthenticationMWs.authorisePath('mediaPath', false),
      GalleryMWs.loadFile,
      RenderingMWs.renderFile
    );
  }

  private static addGetVideo(app: Express) {
    app.get(['/api/gallery/content/:mediaPath(*\.(mp4|ogg|ogv|webm))'],
      AuthenticationMWs.authenticate,
      AuthenticationMWs.normalizePathParam('mediaPath'),
      AuthenticationMWs.authorisePath('mediaPath', false),
      GalleryMWs.loadFile,
      RenderingMWs.renderFile
    );
  }

  private static addGetMetaFile(app: Express) {
    app.get(['/api/gallery/content/:mediaPath(*\.(gpx))'],
      AuthenticationMWs.authenticate,
      AuthenticationMWs.normalizePathParam('mediaPath'),
      AuthenticationMWs.authorisePath('mediaPath', false),
      GalleryMWs.loadFile,
      RenderingMWs.renderFile
    );
  }

  private static addRandom(app: Express) {
    app.get(['/api/gallery/random'],
      AuthenticationMWs.authenticate,
      AuthenticationMWs.authorise(UserRoles.Guest),
      VersionMWs.injectGalleryVersion,
      GalleryMWs.getRandomImage,
      GalleryMWs.loadFile,
      RenderingMWs.renderFile
    );
  }

  private static addGetImageThumbnail(app: Express) {
    app.get('/api/gallery/content/:mediaPath(*\.(jpg|jpeg|jpe|webp|png|gif|svg))/thumbnail/:size?',
      AuthenticationMWs.authenticate,
      AuthenticationMWs.normalizePathParam('mediaPath'),
      AuthenticationMWs.authorisePath('mediaPath', false),
      GalleryMWs.loadFile,
      ThumbnailGeneratorMWs.generateThumbnailFactory(ThumbnailSourceType.Image),
      RenderingMWs.renderFile
    );
  }

  private static addGetVideoThumbnail(app: Express) {
    app.get('/api/gallery/content/:mediaPath(*\.(mp4|ogg|ogv|webm))/thumbnail/:size?',
      AuthenticationMWs.authenticate,
      AuthenticationMWs.normalizePathParam('mediaPath'),
      AuthenticationMWs.authorisePath('mediaPath', false),
      GalleryMWs.loadFile,
      ThumbnailGeneratorMWs.generateThumbnailFactory(ThumbnailSourceType.Video),
      RenderingMWs.renderFile
    );
  }


  private static addGetVideoIcon(app: Express) {
    app.get('/api/gallery/content/:mediaPath(*\.(mp4|ogg|ogv|webm))/icon',
      AuthenticationMWs.authenticate,
      AuthenticationMWs.normalizePathParam('mediaPath'),
      AuthenticationMWs.authorisePath('mediaPath', false),
      GalleryMWs.loadFile,
      ThumbnailGeneratorMWs.generateIconFactory(ThumbnailSourceType.Video),
      RenderingMWs.renderFile
    );
  }

  private static addGetImageIcon(app: Express) {
    app.get('/api/gallery/content/:mediaPath(*\.(jpg|jpeg|jpe|webp|png|gif|svg))/icon',
      AuthenticationMWs.authenticate,
      AuthenticationMWs.normalizePathParam('mediaPath'),
      AuthenticationMWs.authorisePath('mediaPath', false),
      GalleryMWs.loadFile,
      ThumbnailGeneratorMWs.generateIconFactory(ThumbnailSourceType.Image),
      RenderingMWs.renderFile
    );
  }

  private static addTrashImage(app: Express) {
    app.delete('/api/gallery/content/:mediaPath(*\.(jpg|jpeg|jpe|webp|png|gif|svg|mp4|ogg|ogv|webm))',
      AuthenticationMWs.authenticate,
      AuthenticationMWs.authorise(UserRoles.Admin),
      AuthenticationMWs.normalizePathParam('mediaPath'),
      AuthenticationMWs.authorisePath('mediaPath', false),
      GalleryMWs.trashFile,
      RenderingMWs.renderOK
    );
  }

  private static addSearch(app: Express) {
    app.get('/api/search/:text',
      AuthenticationMWs.authenticate,
      AuthenticationMWs.authorise(UserRoles.Guest),
      VersionMWs.injectGalleryVersion,
      GalleryMWs.search,
      ThumbnailGeneratorMWs.addThumbnailInformation,
      GalleryMWs.cleanUpGalleryResults,
      RenderingMWs.renderResult
    );
  }

  private static addInstantSearch(app: Express) {
    app.get('/api/instant-search/:text',
      AuthenticationMWs.authenticate,
      AuthenticationMWs.authorise(UserRoles.Guest),
      VersionMWs.injectGalleryVersion,
      GalleryMWs.instantSearch,
      ThumbnailGeneratorMWs.addThumbnailInformation,
      GalleryMWs.cleanUpGalleryResults,
      RenderingMWs.renderResult
    );
  }

  private static addAutoComplete(app: Express) {
    app.get('/api/autocomplete/:text',
      AuthenticationMWs.authenticate,
      AuthenticationMWs.authorise(UserRoles.Guest),
      VersionMWs.injectGalleryVersion,
      GalleryMWs.autocomplete,
      RenderingMWs.renderResult
    );
  }

}
