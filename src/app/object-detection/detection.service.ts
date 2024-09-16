import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

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

  uploadVideo(videoFile: File): Observable<any> {
    const formData = new FormData();
    formData.append('video', videoFile, videoFile.name);
    return this.http.post(`${this.baseUrl}/upload`, formData);
  }

  detectObjects(filename: string, objectName: string): Observable<any> {
    const body = { filename, object_name: objectName };
    return this.http.post(`${this.baseUrl}/detect`, body);
  }
}

