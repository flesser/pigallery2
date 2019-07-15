import {SortingMethods} from '../../entities/SortingMethods';
import {UserRoles} from '../../entities/UserDTO';

export module ClientConfig {

  export enum MapProviders {
    OpenStreetMap, Mapbox, Custom
  }

  export interface AutoCompleteConfig {
    enabled: boolean;
    maxItemsPerCategory: number;
    cacheTimeout: number;
  }

  export interface SearchConfig {
    enabled: boolean;
    instantSearchEnabled: boolean;
    InstantSearchTimeout: number;
    instantSearchCacheTimeout: number;
    searchCacheTimeout: number;
    AutoComplete: AutoCompleteConfig;
  }

  export interface SharingConfig {
    enabled: boolean;
    passwordProtected: boolean;
  }

  export interface RandomPhotoConfig {
    enabled: boolean;
  }

  export interface MapConfig {
    enabled: boolean;
    mapProvider: MapProviders;
    mapboxAccessToken: string;
    tileUrl: string;
  }

  export interface ThumbnailConfig {
    iconSize: number;
    personThumbnailSize: number;
    thumbnailSizes: number[];
    concurrentThumbnailGenerations: number;
  }

  export interface NavBarConfig {
    showItemCount: boolean;
  }

  export interface OtherConfig {
    enableCache: boolean;
    enableOnScrollRendering: boolean;
    defaultPhotoSortingMethod: SortingMethods;
    enableOnScrollThumbnailPrioritising: boolean;
    NavBar: NavBarConfig;
    captionFirstNaming: boolean; // shows the caption instead of the filename in the phot grid
  }

  export interface VideoConfig {
    enabled: boolean;
  }

  export interface MetaFileConfig {
    enabled: boolean;
  }

  export interface FacesConfig {
    enabled: boolean;
    keywordsToPersons: boolean;
    writeAccessMinRole: UserRoles;
  }

  export interface TrashConfig {
    enabled: boolean;
    trashFolderName: string;
  }

  export interface Config {
    applicationTitle: string;
    publicUrl: string;
    urlBase: string;
    Thumbnail: ThumbnailConfig;
    Search: SearchConfig;
    Sharing: SharingConfig;
    Map: MapConfig;
    RandomPhoto: RandomPhotoConfig;
    Other: OtherConfig;
    authenticationRequired: boolean;
    unAuthenticatedUserRole: UserRoles;
    languages: string[];
    Video: VideoConfig;
    MetaFile: MetaFileConfig;
    Faces: FacesConfig;
    Trash: TrashConfig;
  }

}

/**
 * These configuration will be available at frontend and backend too
 */
export class PublicConfigClass {

  public Client: ClientConfig.Config = {
    applicationTitle: 'PiGallery 2',
    Thumbnail: {
      concurrentThumbnailGenerations: 1,
      thumbnailSizes: [200, 400, 600],
      iconSize: 45,
      personThumbnailSize: 200
    },
    Search: {
      enabled: true,
      instantSearchEnabled: true,
      InstantSearchTimeout: 3000,
      searchCacheTimeout: 1000 * 60 * 60,
      instantSearchCacheTimeout: 1000 * 60 * 60,
      AutoComplete: {
        enabled: true,
        cacheTimeout: 1000 * 60 * 60,
        maxItemsPerCategory: 5
      }
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
      trashFolderName: '_pigallery2_trash'
    },
    authenticationRequired: true,
    unAuthenticatedUserRole: UserRoles.Admin,
    publicUrl: '',
    urlBase: '',
    languages: []
  };

}

