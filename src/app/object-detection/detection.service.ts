import { HttpClient, HttpEventType } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class DetectionService {

  private baseUrl = 'http://127.0.0.1:5000';

  constructor(private http: HttpClient) { }

  uploadDetectImage(file: File): Observable<any> {
    const formData: FormData = new FormData();
    formData.append('file', file, file.name);

    // Send the HTTP request
    return this.http.post<any>(`${this.baseUrl}/upload`, formData, {
      observe: 'response' // Use 'response' to get the full HTTP response
    });
  }

  uploadVideo(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('video', file);

    // Send the video file to the Flask backend
    return this.http.post(`${this.baseUrl}/uploadVideo`, formData, {
      reportProgress: true,
      observe: 'events'
    }).pipe(
      map(event => {
        switch (event.type) {
          case HttpEventType.UploadProgress:
            // Compute and return the upload progress
            const progress = Math.round((100 * event.loaded) / event.total);
            return { status: 'progress', progress: progress };

          case HttpEventType.Response:
            // Return the detected objects once the upload is complete
            return { status: 'done', body: event.body };

          default:
            return `Unhandled event: ${event.type}`;
        }
      })
    );
  }
}

