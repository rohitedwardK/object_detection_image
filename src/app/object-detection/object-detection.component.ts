import { HttpEventType } from '@angular/common/http';
import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { AiExamplesService } from '../ai-examples/ai-service.service';
import { DetectionService } from './detection.service';

@Component({
  selector: 'app-object-detection',
  templateUrl: './object-detection.component.html',
  styleUrls: ['./object-detection.component.scss']
})
export class ObjectDetectionComponent implements OnInit, AfterViewInit {

  isLoading: boolean = false;
  imageSrc: string | ArrayBuffer | null = null;
  detectedObjects: any = {};
  selectedFile: File | null = null;
  videoFile: File | null = null;
  filename: string | null = null;
  detectedFrames: number[] = [];
  objectNames: string = '';
  startFrame: number | null = null;
  objects: any[] = [];
  uploadProgress: number = 0;
  searchObject: string = '';
  @ViewChild('videoPlayer') videoPlayer: ElementRef<HTMLVideoElement>;
  videoSrc: string = '';
  objectOccurrences: any;

  constructor(private detectService: DetectionService) { }

  ngOnInit(): void {
  }
  videoLoaded = false;

  ngAfterViewInit() {
    this.videoPlayer.nativeElement.addEventListener('canplay', () => {
      this.videoLoaded = true;
    });
  }

  public onFileSelected(event): void {
    this.selectedFile = event.target.files[0];
  }

  public uploadImage(): void{
    if (this.selectedFile) {
      this.isLoading = true;
      this.imageSrc = "";
      this.detectService.uploadDetectImage(this.selectedFile).subscribe(
        (event: any) => {
          if (event.type === HttpEventType.Response) {
            // Check if response body has the expected properties
            if (event.body && event.body.image && event.body.detected_objects) {
              // Directly set the base64 image string to imageSrc
              this.imageSrc = 'data:image/png;base64,' + event.body.image;
              // Update detected objects data
              this.detectedObjects = event.body.detected_objects;
              this.isLoading = false;
            } else {
              console.error('Unexpected response structure:', event.body);
              this.isLoading = false;
            }
          }
        },
        error => {
          console.error('Error uploading image:', error);
          this.isLoading = false;
        }
      );
    }
  }


  // uploadVideo(): void {
  //   if (this.selectedFile) {
  //     this.detectService.uploadVideo(this.selectedFile).subscribe((response) => {
  //       this.filename = response.filename;
  //       console.log('Video uploaded:', this.filename);
  //     });
  //   }
  // }

  // searchObjects(): void {
  //   if (this.filename && this.objectNames.length > 0) {
  //     this.detectService.detectObjects(this.filename, this.objectNames).subscribe((response) => {
  //       this.detectedFrames = response.detected_frames;
  //       this.startFrame = response.start_frame;
  //       console.log('Detected frames:', this.detectedFrames);
  //       this.playFromFrame();
  //     });
  //   }
  // }

  // playFromFrame(): void {
  //   const video = document.getElementById('videoPlayer') as HTMLVideoElement;
  //   if (video && this.startFrame !== null) {
  //     video.currentTime = this.startFrame / 30; // Assuming 30 FPS
  //     video.play();
  //     alert(`Playing video from frame ${this.startFrame}`);
  //   }
  // }

  uploadVideo() {
    this.initializeObj();
    this.videoSrc = "";
    this.uploadProgress = 0;
    this.objectOccurrences = {};
    this.detectService.uploadVideo(this.selectedFile).subscribe((event) => {
      if (event.status === 'progress') {
        // Update the progress bar
        this.uploadProgress = event.progress;
      } else if (event.status === 'done') {
        // Handle the response from the backend and extract objects
        this.objects = event.body.detectedObjects;
        this.detectOccurances(this.objects);
        // Set the video source to the uploaded video
        this.videoSrc = `assets/${this.selectedFile.name}`; // Adjust path as necessary
      }
    });
  }

  searchForObject() {
    const foundObject = this.objects.find(obj => obj.name === this.searchObject);
    if (foundObject) {
      this.videoPlayer.nativeElement.src = this.videoSrc;
      this.videoPlayer.nativeElement.load();
      this.videoPlayer.nativeElement.addEventListener("loadedmetadata", () => {
      this.videoPlayer.nativeElement.currentTime = foundObject.timestamp;
      this.videoPlayer.nativeElement.play();
      });
    } else {
      alert('Object not found');
    }
  }

  public detectOccurances(frameResults: any): void{
    this.objectOccurrences = frameResults.reduce((acc, current) => {
      const name = current.name;
      acc[name] = (acc[name] || 0) + 1;
      return acc;
    }, {});
  }

  public initializeObj(): void{
    this.objects = [];
    this.videoSrc = "";
    this.uploadProgress = 0;
    this.objectOccurrences = {};
  }
}
