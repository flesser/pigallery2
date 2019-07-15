import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
  QueryList,
  ViewChild
} from '@angular/core';
import {GalleryPhotoComponent} from '../grid/photo/photo.grid.gallery.component';
import {Dimension} from '../../../model/IRenderable';
import {FullScreenService} from '../fullscreen.service';
import {OverlayService} from '../overlay.service';
import {animate, AnimationBuilder, AnimationPlayer, style} from '@angular/animations';
import {GalleryLightboxMediaComponent} from './media/media.lightbox.gallery.component';
import {Observable, Subscription, timer} from 'rxjs';
import {filter} from 'rxjs/operators';
import {ActivatedRoute, Params, Router} from '@angular/router';
import {PageHelper} from '../../../model/page.helper';
import {QueryService} from '../../../model/query.service';
import {MediaDTO} from '../../../../../common/entities/MediaDTO';
import {QueryParams} from '../../../../../common/QueryParams';
import {GalleryService} from '../gallery.service';
import {PhotoDTO} from '../../../../../common/entities/PhotoDTO';

export enum LightboxStates {
  Open = 1,
  Closing = 2,
  Closed = 3
}

export enum PlayBackStates {
  Paused = 1,
  Play = 2,
  FastForward = 3
}

@Component({
  selector: 'app-gallery-lightbox',
  styleUrls: ['./lightbox.gallery.component.css', './inputrange.css'],
  templateUrl: './lightbox.gallery.component.html'
})
export class GalleryLightboxComponent implements OnDestroy, OnInit {

  readonly MAX_ZOOM = 10;

  @ViewChild('photo') mediaElement: GalleryLightboxMediaComponent;
  @ViewChild('lightbox') lightboxElement: ElementRef;
  @ViewChild('root') root: ElementRef;

  public navigation = {hasPrev: true, hasNext: true};
  public blackCanvasOpacity = 0;

  private activePhotoId: number = null;
  public activePhoto: GalleryPhotoComponent;
  private gridPhotoQL: QueryList<GalleryPhotoComponent>;

  public status: LightboxStates = LightboxStates.Closed;
  private subscription: {
    photosChange: Subscription,
    route: Subscription
  } = {
    photosChange: null,
    route: null
  };
  private timer: Observable<number>;
  private timerSub: Subscription;
  public playBackState: PlayBackStates = PlayBackStates.Paused;
  public PlayBackStates = PlayBackStates;
  public controllersDimmed = false;
  public controllersAlwaysOn = false;
  public controllersVisible = true;

  public infoPanelVisible = false;
  public infoPanelWidth = 0;
  public animating = false;
  startPhotoDimension: Dimension = <Dimension>{top: 0, left: 0, width: 0, height: 0};
  iPvisibilityTimer: number = null;
  visibilityTimer: number = null;
  delayedMediaShow: string = null;
  public zoom = 1;
  public drag = {x: 0, y: 0};
  private prevDrag = {x: 0, y: 0};
  private prevZoom = 1;

  constructor(public fullScreenService: FullScreenService,
              private changeDetector: ChangeDetectorRef,
              private overlayService: OverlayService,
              private _builder: AnimationBuilder,
              private router: Router,
              private queryService: QueryService,
              private galleryService: GalleryService,
              private route: ActivatedRoute) {
  }

  ngOnInit(): void {
    this.timer = timer(1000, 2000);
    this.subscription.route = this.route.queryParams.subscribe((params: Params) => {
      if (params[QueryParams.gallery.photo] && params[QueryParams.gallery.photo] !== '') {
        if (!this.gridPhotoQL) {
          return this.delayedMediaShow = params[QueryParams.gallery.photo];
        }
        this.onNavigateTo(params[QueryParams.gallery.photo]);
      } else if (this.status === LightboxStates.Open) {
        this.delayedMediaShow = null;
        this.hideLightbox();
      }
    });
  }


  ngOnDestroy(): void {
    this.pause();
    if (this.subscription.photosChange != null) {
      this.subscription.photosChange.unsubscribe();
    }
    if (this.subscription.route != null) {
      this.subscription.route.unsubscribe();
    }

    if (this.visibilityTimer != null) {
      clearTimeout(this.visibilityTimer);
    }
    if (this.iPvisibilityTimer != null) {
      clearTimeout(this.iPvisibilityTimer);
    }
  }

  onNavigateTo(photoStringId: string) {
    if (this.activePhoto && this.queryService.getMediaStringId(this.activePhoto.gridPhoto.media) === photoStringId) {
      return;
    }

    this.Zoom = 1;
    const photo = this.gridPhotoQL.find(i => this.queryService.getMediaStringId(i.gridPhoto.media) === photoStringId);
    if (!photo) {
      return this.delayedMediaShow = photoStringId;
    }
    if (this.status === LightboxStates.Closed) {
      this.showLigthbox(photo.gridPhoto.media);
    } else {
      this.showPhoto(this.gridPhotoQL.toArray().indexOf(photo));
    }
    this.delayedMediaShow = null;
  }

  setGridPhotoQL(value: QueryList<GalleryPhotoComponent>) {
    if (this.subscription.photosChange != null) {
      this.subscription.photosChange.unsubscribe();
    }
    this.gridPhotoQL = value;
    this.subscription.photosChange = this.gridPhotoQL.changes.subscribe(() => {
      if (this.activePhotoId != null && this.gridPhotoQL.length > this.activePhotoId) {
        this.updateActivePhoto(this.activePhotoId);
      }
      if (this.delayedMediaShow) {
        this.onNavigateTo(this.delayedMediaShow);
      }
    });

    if (this.delayedMediaShow) {
      this.onNavigateTo(this.delayedMediaShow);
    }
  }

  pan($event: any) {
    if (!this.activePhoto || this.activePhoto.gridPhoto.isVideo()) {
      return;
    }
    if (this.zoom === 1) {
      return;
    }
    this.drag.x = this.prevDrag.x + $event.deltaX;
    this.drag.y = this.prevDrag.y + $event.deltaY;
    this.checkZoomAndDrag();
    if ($event.isFinal) {
      this.prevDrag = {
        x: this.drag.x,
        y: this.drag.y,
      };
    }
  }

  wheel($event: any) {
    if (!this.activePhoto || this.activePhoto.gridPhoto.isVideo()) {
      return;
    }
    if ($event.deltaY < 0) {
      this.zoomIn();
    } else {
      this.zoomOut();
    }
  }

  @HostListener('pinch', ['$event'])
  pinch($event: any) {
    if (!this.activePhoto || this.activePhoto.gridPhoto.isVideo()) {
      return;
    }
    this.showControls();
    this.Zoom = this.prevZoom * $event.scale;
  }

  @HostListener('pinchend', ['$event'])
  pinchend($event: any) {
    if (!this.activePhoto || this.activePhoto.gridPhoto.isVideo()) {
      return;
    }
    this.showControls();
    this.Zoom = this.prevZoom * $event.scale;
    this.prevZoom = this.zoom;
  }

  tap($event: any) {
    if (!this.activePhoto || this.activePhoto.gridPhoto.isVideo()) {
      return;
    }
    if ($event.tapCount < 2) {
      return;
    }

    this.showControls();
    if (this.zoom > 1) {
      this.Zoom = 1;
      this.prevZoom = this.zoom;
      return;
    } else {
      this.Zoom = 5;
      this.prevZoom = this.zoom;
      return;
    }
  }

  zoomIn() {
    this.showControls();
    this.Zoom = this.zoom + this.zoom / 10;
  }

  zoomOut() {
    this.showControls();
    this.Zoom = this.zoom - this.zoom / 10;
  }


  public get Zoom(): number {
    return this.zoom;
  }

  public set Zoom(zoom: number) {
    if (!this.activePhoto || this.activePhoto.gridPhoto.isVideo()) {
      return;
    }
    if (zoom < 1) {
      zoom = 1;
    }
    if (zoom > this.MAX_ZOOM) {
      zoom = this.MAX_ZOOM;
    }
    if (this.zoom === zoom) {
      return;
    }
    this.pause();
    this.drag.x = this.drag.x / this.zoom * zoom;
    this.drag.y = this.drag.y / this.zoom * zoom;
    this.prevDrag.x = this.drag.x;
    this.prevDrag.y = this.drag.y;
    this.zoom = zoom;
    this.checkZoomAndDrag();
  }

  private checkZoomAndDrag() {
    const fixDrag = (drag: { x: number, y: number }) => {
      if (this.zoom === 1) {
        drag.y = 0;
        drag.x = 0;
        return;
      }
      if (!this.activePhoto) {
        return;
      }

      const photoAspect = MediaDTO.calcRotatedAspectRatio(this.activePhoto.gridPhoto.media);
      const widthFilled = photoAspect > this.getWindowAspectRatio();
      const divWidth = this.getPhotoFrameWidth();
      const divHeight = this.getPhotoFrameHeight();
      const size = {
        width: (widthFilled ? divWidth : divHeight * photoAspect) * this.zoom,
        height: (widthFilled ? divWidth / photoAspect : divHeight) * this.zoom
      };


      const widthDrag = Math.abs(divWidth - size.width) / 2;
      const heightDrag = Math.abs(divHeight - size.height) / 2;

      if (divWidth > size.width) {
        drag.x = 0;
      }
      if (divHeight > size.height) {
        drag.y = 0;
      }

      if (drag.x < -widthDrag) {
        drag.x = -widthDrag;
      }
      if (drag.x > widthDrag) {
        drag.x = widthDrag;
      }
      if (drag.y < -heightDrag) {
        drag.y = -heightDrag;
      }
      if (drag.y > heightDrag) {
        drag.y = heightDrag;
      }
    };
    if (this.zoom < 1) {
      this.zoom = 1;
    }
    if (this.zoom > this.MAX_ZOOM) {
      this.zoom = this.MAX_ZOOM;
    }
    fixDrag(this.drag);
    fixDrag(this.prevDrag);
  }

//noinspection JSUnusedGlobalSymbols
  @HostListener('window:resize', ['$event'])
  onResize() {
    if (this.activePhoto) {
      this.animateLightbox();
      this.updateActivePhoto(this.activePhotoId);
    }
  }

  public nextImage() {
    if (this.activePhotoId + 1 < this.gridPhotoQL.length) {
      this.navigateToPhoto(this.activePhotoId + 1);
    }
  }

  public prevImage() {
    this.pause();
    if (this.activePhotoId > 0) {
      this.navigateToPhoto(this.activePhotoId - 1);
    }
  }


  private navigateToPhoto(photoIndex: number) {
    this.router.navigate([],
      {queryParams: this.queryService.getParams(this.gridPhotoQL.toArray()[photoIndex].gridPhoto.media)}).catch(console.error);
  }

  private showPhoto(photoIndex: number, resize: boolean = true) {
    this.activePhoto = null;
    this.changeDetector.detectChanges();
    this.updateActivePhoto(photoIndex, resize);
  }

  public showLigthbox(photo: MediaDTO) {
    this.Zoom = 1;
    this.controllersVisible = true;
    this.showControls();
    this.status = LightboxStates.Open;
    const selectedPhoto = this.findPhotoComponent(photo);
    if (selectedPhoto === null) {
      throw new Error('Can\'t find Photo');
    }

    const lightboxDimension = selectedPhoto.getDimension();
    lightboxDimension.top -= PageHelper.ScrollY;
    this.animating = true;
    this.animatePhoto(selectedPhoto.getDimension(), this.calcLightBoxPhotoDimension(selectedPhoto.gridPhoto.media)).onDone(() => {
      this.animating = false;
    });
    this.animateLightbox(
      lightboxDimension,
      <Dimension>{
        top: 0,
        left: 0,
        width: this.getPhotoFrameWidth(),
        height: this.getPhotoFrameHeight()
      });


    this.blackCanvasOpacity = 0;
    this.startPhotoDimension = selectedPhoto.getDimension();
    // disable scroll
    this.overlayService.showOverlay();
    this.blackCanvasOpacity = 1.0;
    this.showPhoto(this.gridPhotoQL.toArray().indexOf(selectedPhoto), false);
  }

  @HostListener('window:keydown', ['$event'])
  onKeyPress(e: KeyboardEvent) {
    if (this.status !== LightboxStates.Open) {
      return;
    }
    const event: KeyboardEvent = window.event ? <any>window.event : e;
    switch (event.key) {
      case 'ArrowLeft':
        if (this.activePhotoId > 0) {
          this.prevImage();
        }
        break;
      case 'ArrowRight':
        if (this.activePhotoId < this.gridPhotoQL.length - 1) {
          this.nextImage();
        }
        break;
      case 'i':
      case 'I':
        if (this.isInfoPanelAnimating()) {
          return;
        }
        if (this.infoPanelVisible) {
          this.hideInfoPanel(true);
        } else {
          this.showInfoPanel();
        }
        break;
      case 'f':
      case 'F':
        if (this.fullScreenService.isFullScreenEnabled()) {
          this.fullScreenService.exitFullScreen();
        } else {
          this.fullScreenService.showFullScreen(this.root.nativeElement);
        }
        break;
      case '-':
        this.zoomOut();
        break;
      case '+':
        this.zoomIn();
        break;
      case 'c':
      case 'C':
        this.controllersAlwaysOn = !this.controllersAlwaysOn;
        break;
      case 'Escape': // escape
        this.hide();
        break;
      case ' ': // space
        if (this.activePhoto && this.activePhoto.gridPhoto.isVideo()) {
          this.mediaElement.playPause();
        }
        break;
      case 'Delete': // move to trash
        this.trashImage();
        break;
    }
  }

  public hide() {
    this.router.navigate([],
      {queryParams: this.queryService.getParams()}).catch(console.error);
  }

  private hideLightbox() {
    this.Zoom = 1;
    this.controllersVisible = false;
    this.status = LightboxStates.Closing;
    this.fullScreenService.exitFullScreen();
    this.pause();

    this.animating = true;
    const lightboxDimension = this.activePhoto.getDimension();
    lightboxDimension.top -= PageHelper.ScrollY;
    this.blackCanvasOpacity = 0;

    this.animatePhoto(this.calcLightBoxPhotoDimension(this.activePhoto.gridPhoto.media), this.activePhoto.getDimension());
    this.animateLightbox(<Dimension>{
      top: 0,
      left: 0,
      width: this.getPhotoFrameWidth(),
      height: this.getPhotoFrameHeight()
    }, lightboxDimension).onDone(() => {
      this.status = LightboxStates.Closed;
      this.activePhoto = null;
      this.activePhotoId = null;
      this.overlayService.hideOverlay();
    });


    this.hideInfoPanel(false);

  }


  animatePhoto(from: Dimension, to: Dimension = from): AnimationPlayer {
    const elem = this._builder.build([
      style(Dimension.toString(from)),
      animate(300,
        style(Dimension.toString(to)))
    ])
      .create(this.mediaElement.elementRef.nativeElement);
    elem.play();
    return elem;
  }

  animateLightbox(from: Dimension = <Dimension>{
    top: 0,
    left: 0,
    width: this.getPhotoFrameWidth(),
    height: this.getPhotoFrameHeight()
  }, to: Dimension = from): AnimationPlayer {
    const elem = this._builder.build([
      style(Dimension.toString(from)),
      animate(300,
        style(Dimension.toString(to)))
    ])
      .create(this.lightboxElement.nativeElement);
    elem.play();
    return elem;
  }


  public toggleInfoPanel() {
    if (this.infoPanelWidth !== 400) {
      this.showInfoPanel();
    } else {
      this.hideInfoPanel();
    }
  }

  public trashImage() {
    const confirmMsg = this.activePhoto.gridPhoto.isInTrash() ?
      `Restore '${this.activePhoto.gridPhoto.getRelativePath()}' (moving it up one directory)?` :
      `Move '${this.activePhoto.gridPhoto.getRelativePath()}' to trash?`;

    if (confirm(confirmMsg)) {
      this.galleryService.trashImage(this.activePhoto.gridPhoto.getRelativePath()).then(() => {
        if (this.navigation.hasNext) {
          this.nextImage();
        } else if (this.navigation.hasPrev) {
          this.prevImage();
        } else {
          this.hide();
        }
      }).catch((err) => {
        alert('Error: ' + err.message);
      });
    }
  }

  hideInfoPanel(_animate: boolean = true) {
    this.iPvisibilityTimer = window.setTimeout(() => {
      this.iPvisibilityTimer = null;
      this.infoPanelVisible = false;
      this.checkZoomAndDrag();
    }, 1000);

    const starPhotoPos = this.calcLightBoxPhotoDimension(this.activePhoto.gridPhoto.media);
    this.infoPanelWidth = 0;
    const endPhotoPos = this.calcLightBoxPhotoDimension(this.activePhoto.gridPhoto.media);
    if (_animate) {
      this.animatePhoto(starPhotoPos, endPhotoPos);
    }
    if (_animate) {
      this.animateLightbox(<Dimension>{
          top: 0,
          left: 0,
          width: Math.max(this.getPhotoFrameWidth() - 400, 0),
          height: this.getPhotoFrameHeight()
        },
        <Dimension>{
          top: 0,
          left: 0,
          width: this.getPhotoFrameWidth(),
          height: this.getPhotoFrameHeight()
        });
    }
  }

  public play() {
    this.pause();
    this.timerSub = this.timer.pipe(filter(t => t % 2 === 0)).subscribe(() => {
      if (this.mediaElement.imageLoadFinished === false) {
        return;
      }
      // do not skip video if its playing
      if (this.activePhoto && this.activePhoto.gridPhoto.isVideo() &&
        !this.mediaElement.Paused) {
        return;
      }
      if (this.navigation.hasNext) {
        this.nextImage();
      } else {
        this.navigateToPhoto(0);
      }
    });
    this.playBackState = PlayBackStates.Play;
  }

  isInfoPanelAnimating(): boolean {
    return this.iPvisibilityTimer != null;
  }

  showInfoPanel() {
    this.infoPanelVisible = true;

    const starPhotoPos = this.calcLightBoxPhotoDimension(this.activePhoto.gridPhoto.media);
    this.infoPanelWidth = 400;
    const endPhotoPos = this.calcLightBoxPhotoDimension(this.activePhoto.gridPhoto.media);
    this.animatePhoto(starPhotoPos, endPhotoPos);
    this.animateLightbox(<Dimension>{
        top: 0,
        left: 0,
        width: this.getPhotoFrameWidth() + 400,
        height: this.getPhotoFrameHeight()
      },
      <Dimension>{
        top: 0,
        left: 0,
        width: this.getPhotoFrameWidth(),
        height: this.getPhotoFrameHeight()
      });
    if (this.iPvisibilityTimer != null) {
      clearTimeout(this.iPvisibilityTimer);
    }

    this.checkZoomAndDrag();
  }

  public fastForward() {
    this.pause();
    this.timerSub = this.timer.subscribe(() => {
      if (this.mediaElement.imageLoadFinished === false) {
        return;
      }
      if (this.activePhoto && this.activePhoto.gridPhoto.isVideo() &&
        !this.mediaElement.Paused) {
        return;
      }
      if (this.navigation.hasNext) {
        this.nextImage();
      } else {
        this.navigateToPhoto(0);
      }
    });
    this.playBackState = PlayBackStates.FastForward;
  }


  public getPhotoFrameWidth(): number {
    return Math.max(window.innerWidth - this.infoPanelWidth, 0);
  }

  public getPhotoFrameHeight(): number {
    return window.innerHeight;
  }

  public getWindowAspectRatio(): number {
    return Math.round(this.getPhotoFrameWidth() / this.getPhotoFrameHeight() * 100) / 100;
  }

  private updateActivePhoto(photoIndex: number, resize: boolean = true) {
    const pcList = this.gridPhotoQL.toArray();


    if (photoIndex < 0 || photoIndex > this.gridPhotoQL.length) {
      throw new Error('Can\'t find the media');
    }
    this.activePhotoId = photoIndex;
    this.activePhoto = pcList[photoIndex];

    if (resize) {
      this.animatePhoto(this.calcLightBoxPhotoDimension(this.activePhoto.gridPhoto.media));
    }
    this.navigation.hasPrev = photoIndex > 0;
    this.navigation.hasNext = photoIndex + 1 < pcList.length;

    const to = this.activePhoto.getDimension();

    // if target image out of screen -> scroll to there
    if (PageHelper.ScrollY > to.top || PageHelper.ScrollY + this.getPhotoFrameHeight() < to.top) {
      PageHelper.ScrollY = to.top;
    }

  }


  @HostListener('mousemove')
  onMouseMove() {
    this.showControls();
  }

  private showControls() {
    this.controllersDimmed = false;
    if (this.visibilityTimer != null) {
      clearTimeout(this.visibilityTimer);
    }
    this.visibilityTimer = window.setTimeout(this.hideControls, 2000);
  }

  private hideControls = () => {
    this.controllersDimmed = true;
  };


  public pause() {
    if (this.timerSub != null) {
      this.timerSub.unsubscribe();
    }
    this.playBackState = PlayBackStates.Paused;
  }

  private findPhotoComponent(media: MediaDTO): GalleryPhotoComponent {
    const galleryPhotoComponents = this.gridPhotoQL.toArray();
    for (let i = 0; i < galleryPhotoComponents.length; i++) {
      if (galleryPhotoComponents[i].gridPhoto.media === media) {
        return galleryPhotoComponents[i];
      }
    }
    return null;
  }

  private calcLightBoxPhotoDimension(photo: MediaDTO): Dimension {
    let width = 0;
    let height = 0;
    const photoAspect = photo.metadata.size.width / photo.metadata.size.height;
    const windowAspect = this.getPhotoFrameWidth() / this.getPhotoFrameHeight();
    if (photoAspect < windowAspect) {
      width = Math.round(photo.metadata.size.width * (this.getPhotoFrameHeight() / photo.metadata.size.height));
      height = this.getPhotoFrameHeight();
    } else {
      width = this.getPhotoFrameWidth();
      height = Math.round(photo.metadata.size.height * (this.getPhotoFrameWidth() / photo.metadata.size.width));
    }
    const top = (this.getPhotoFrameHeight() / 2 - height / 2);
    const left = (this.getPhotoFrameWidth() / 2 - width / 2);

    return <Dimension>{top: top, left: left, width: width, height: height};
  }

  public isVisible(): boolean {
    return this.status !== LightboxStates.Closed;
  }


  get Title(): string {
    if (!this.activePhoto) {
      return null;
    }
    return (<PhotoDTO>this.activePhoto.gridPhoto.media).metadata.caption;
  }
}

