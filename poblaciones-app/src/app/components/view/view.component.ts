import { Component, OnInit } from '@angular/core';
import { DataService } from '../../services/data.service';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommonModule, NgIf } from '@angular/common';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ErrorDialogComponent } from '../../error-dialog/error-dialog.component';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatSliderModule } from '@angular/material/slider';
import {
  FormsModule,
  ReactiveFormsModule,
  FormGroup,
  FormControl,
  FormBuilder,
} from '@angular/forms';

// Registrar los componentes de Chart.js
Chart.register(...registerables);

@Component({
  selector: 'app-view',
  standalone: true,
  imports: [
    MatProgressSpinnerModule,
    CommonModule,
    MatButtonModule,
    MatDialogModule,
    MatInputModule,
    MatSliderModule,
    NgIf,
    FormsModule,
    ReactiveFormsModule,
  ],
  templateUrl: './view.component.html',
  styleUrls: ['./view.component.css'],
})
export class ViewComponent implements OnInit {
  // Objeto para almacenar las poblaciones por continente
  continents: { [key: string]: number } = {};
  // Variable para la instancia del gráfico
  chart: Chart | null = null;
  // Indicadores de estado de carga y error
  loading: boolean = true;
  error: boolean = false;

  // Formulario reactivo para el filtro de población
  filterForm: FormGroup;

  constructor(
    private dataService: DataService,
    public dialog: MatDialog,
    private fb: FormBuilder
  ) {
    // Inicializar el formulario reactivo con un control para el valor del filtro
    this.filterForm = this.fb.group({
      filterValue: [0],
    });
  }

  ngOnInit(): void {
    // Cargar los datos iniciales
    this.loadData();
    // Suscribirse a los cambios en el formulario para actualizar el filtro
    this.filterForm.valueChanges.subscribe((value) => {
      this.updateFilter(value.filterValue);
    });
  }

  // Getter para obtener el control del valor del filtro del formulario
  get filterValueControl(): FormControl {
    return this.filterForm.get('filterValue') as FormControl;
  }

  // Método para cargar los datos desde el servicio
  private loadData() {
    this.loading = true; // Mostrar el spinner de carga
    this.error = false; // Resetear el estado de error

    // Suscribirse a la observación del servicio de datos
    this.dataService.getCountries().subscribe({
      next: (data) => {
        // Agrupar los datos por continente y crear el gráfico
        this.continents = this.dataService.groupByContinent(data);
        this.createChart();
        this.loading = false; // Ocultar el spinner de carga
      },
      error: (error) => {
        // Manejar errores y mostrar el diálogo de error
        console.error('Error fetching countries:', error);
        this.openErrorDialog();
        this.loading = false; // Ocultar el spinner de carga
      },
    });
  }

  // Método para abrir el diálogo de error
  openErrorDialog() {
    const dialogRef = this.dialog.open(ErrorDialogComponent);

    // Manejar la respuesta del diálogo
    dialogRef.afterClosed().subscribe((result) => {
      if (result === 'retry') {
        this.loadData(); // Intentar recargar los datos si el usuario elige reintentar
      }
    });
  }

  // Método para crear el gráfico
  createChart(): void {
    // Obtener el elemento canvas del DOM
    const canvas = document.getElementById(
      'continentChart'
    ) as HTMLCanvasElement;
    if (!canvas) {
      console.error('El elemento canvas no está disponible en el DOM.');
      return;
    }

    // Preparar los datos y la configuración del gráfico
    const labels = Object.keys(this.continents);
    const data = Object.values(this.continents).filter(
      (pop: any) => pop >= this.filterForm.value.filterValue
    );

    const chartConfig: ChartConfiguration = {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Population by Continent',
            data: data,
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
          },
        },
        layout: {
          padding: {
            left: 50,
            right: 50,
            top: 50,
            bottom: 50,
          },
        },
      },
    };

    // Destruir el gráfico anterior si existe
    if (this.chart) {
      this.chart.destroy();
    }

    // Crear un nuevo gráfico
    this.chart = new Chart(canvas, chartConfig);
  }

  // Método para actualizar el filtro del gráfico
  updateFilter(value: number): void {
    if (this.chart) {
      // Actualizar los datos del gráfico en función del filtro
      this.chart.data.datasets[0].data = Object.values(this.continents).filter(
        (pop: any) => pop >= value
      );
      this.chart.update(); // Refrescar el gráfico
    }
  }
}
