import {Injectable} from '@angular/core';
import {BehaviorSubject} from 'rxjs';
import {
  DatabaseType,
  IPrivateConfig,
  LogLevel,
  ReIndexingSensitivity,
  SQLLogLevel,
  ThumbnailProcessingLib
} from '../../../../common/config/private/IPrivateConfig';
import {NetworkService} from '../../model/network/network.service';
import {SortingMethods} from '../../../../common/entities/SortingMethods';
import {UserRoles} from '../../../../common/entities/UserDTO';
import {ClientConfig} from '../../../../common/config/public/ConfigClass';

@Injectable()
export class SettingsService {
  public settings: BehaviorSubject<IPrivateConfig>;

  constructor(private _networkService: NetworkService) {
    this.settings = new BehaviorSubject<IPrivateConfig>({
      Client: {
        Search: {
          enabled: true,
          AutoComplete: {
            enabled: true,
            cacheTimeout: 1000 * 60 * 60,
            maxItemsPerCategory: 5
          },
          instantSearchEnabled: true,
          InstantSearchTimeout: 0,
          searchCacheTimeout: 1000 * 60 * 60,
          instantSearchCacheTimeout: 1000 * 60 * 60,
        },
        Thumbnail: {
          concurrentThumbnailGenerations: null,
          iconSize: 30,
          personThumbnailSize: 200,
          thumbnailSizes: []
        },
        Sharing: {
          enabled: true,
          passwordProtected: true
        },
        Map: {
          enabled: true,
          mapProvider: ClientConfig.MapProviders.OpenStreetMap,
          mapboxAccessToken: '',
          tileUrl: ''
        },
        RandomPhoto: {
          enabled: true
        },
        Video: {
          enabled: true
        },
        MetaFile: {
          enabled: true
        },
        Other: {
          captionFirstNaming: false,
          enableCache: true,
          enableOnScrollRendering: true,
          enableOnScrollThumbnailPrioritising: true,
          defaultPhotoSortingMethod: SortingMethods.ascDate,
          NavBar: {
            showItemCount: true
          }
        },
        Faces: {
          enabled: true,
          keywordsToPersons: true,
          writeAccessMinRole: UserRoles.Admin
        },
        Trash: {
          enabled: false,
          trashFolderName: '_pigallery2_trash',
        },
        urlBase: '',
        publicUrl: '',
        applicationTitle: '',
        authenticationRequired: true,
        unAuthenticatedUserRole: UserRoles.Admin,
        languages: []
      },
      Server: {
        database: {
          type: DatabaseType.memory
        },
        log: {
          level: LogLevel.info,
          sqlLevel: SQLLogLevel.error
        },
        sharing: {
          updateTimeout: 2000
        },
        imagesFolder: '',
        port: 80,
        host: '0.0.0.0',
        thumbnail: {
          personFaceMargin: 0.1,
          folder: '',
          qualityPriority: true,
          processingLibrary: ThumbnailProcessingLib.sharp
        },
        threading: {
          enable: true,
          thumbnailThreads: 0
        },
        sessionTimeout: 0,
        indexing: {
          cachedFolderTimeout: 0,
          folderPreviewSize: 0,
          reIndexingSensitivity: ReIndexingSensitivity.medium
        },
        photoMetadataSize: 512 * 1024,
        duplicates: {
          listingLimit: 1000
        }
      }
    });
  }

  public async getSettings(): Promise<void> {
    this.settings.next(await <Promise<IPrivateConfig>>this._networkService.getJson('/settings'));
  }


}
