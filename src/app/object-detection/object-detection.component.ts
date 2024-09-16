import { HttpEventType } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { AiExamplesService } from '../ai-examples/ai-service.service';
import { DetectionService } from './detection.service';

@Component({
  selector: 'app-object-detection',
  templateUrl: './object-detection.component.html',
  styleUrls: ['./object-detection.component.scss']
})
export class ObjectDetectionComponent implements OnInit {

  isLoading: boolean = false;
  imageSrc: string | ArrayBuffer | null = null;
  detectedObjects: any = {};
  selectedFile: File | null = null;
  videoFile: File | null = null;
  filename: string | null = null;
  detectedFrames: number[] = [];
  objectNames: string = '';
  startFrame: number | null = null;
  
  constructor(private detectService: DetectionService) { }

  ngOnInit(): void {
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


  uploadVideo(): void {
    if (this.selectedFile) {
      this.detectService.uploadVideo(this.selectedFile).subscribe((response) => {
        this.filename = response.filename;
        console.log('Video uploaded:', this.filename);
      });
    }
  }

  searchObjects(): void {
    if (this.filename && this.objectNames.length > 0) {
      this.detectService.detectObjects(this.filename, this.objectNames).subscribe((response) => {
        this.detectedFrames = response.detected_frames;
        this.startFrame = response.start_frame;
        console.log('Detected frames:', this.detectedFrames);
        this.playFromFrame();
      });
    }
  }

  playFromFrame(): void {
    const video = document.getElementById('videoPlayer') as HTMLVideoElement;
    if (video && this.startFrame !== null) {
      video.currentTime = this.startFrame / 30; // Assuming 30 FPS
      video.play();
      alert(`Playing video from frame ${this.startFrame}`);
    }
  }
}
