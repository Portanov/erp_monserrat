import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Header } from '../../components/header/header';
import { Footer } from '../../components/footer/footer';

@Component({
  selector: 'app-public-layout',
  imports: [RouterOutlet, Header, Footer],
  templateUrl: './public-layout.html',
  styleUrl: './public-layout.css',
})

export class PublicLayout {

}
