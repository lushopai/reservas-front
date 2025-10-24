import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../../../core/services/auth.service';
import { UserService } from '../../../../core/services/UserService.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.component.html',
  styleUrls: ['./perfil.component.scss']
})
export class PerfilComponent implements OnInit {
  perfilForm!: FormGroup;
  passwordForm!: FormGroup;

  usuario: any = null;
  editando: boolean = false;
  cambiandoPassword: boolean = false;
  cargando: boolean = false;

  hideCurrentPassword: boolean = true;
  hideNewPassword: boolean = true;
  hideConfirmPassword: boolean = true;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.initForms();
    this.cargarPerfil();
  }

  initForms(): void {
    // Formulario de perfil
    this.perfilForm = this.fb.group({
      nombres: ['', [Validators.required, Validators.minLength(2)]],
      apellidos: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      telefono: ['', [Validators.required, Validators.pattern(/^[0-9]{9,12}$/)]],
      documento: ['', [Validators.required]],
      tipoDocumento: ['RUT', Validators.required]
    });

    // Formulario de cambio de contraseña
    this.passwordForm = this.fb.group({
      currentPassword: ['', [Validators.required, Validators.minLength(6)]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  passwordMatchValidator(form: FormGroup) {
    const newPassword = form.get('newPassword');
    const confirmPassword = form.get('confirmPassword');

    if (newPassword && confirmPassword && newPassword.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }

    return null;
  }

  cargarPerfil(): void {
    this.cargando = true;
    const userId = this.authService.getCurrentUserId();

    if (!userId) {
      Swal.fire('Error', 'No se pudo obtener el ID del usuario', 'error');
      this.cargando = false;
      return;
    }

    this.userService.getUserById(userId).subscribe({
      next: (response) => {
        this.usuario = response;
        this.perfilForm.patchValue({
          nombres: response.nombre,
          apellidos: response.apellidos,
          email: response.email,
          telefono: response.telefono,
          documento: response.documento,
          tipoDocumento: response.tipoDocumento || 'RUT'
        });
        this.perfilForm.disable();
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al cargar perfil:', error);
        Swal.fire('Error', 'No se pudo cargar el perfil del usuario', 'error');
        this.cargando = false;
      }
    });
  }

  toggleEditar(): void {
    this.editando = !this.editando;

    if (this.editando) {
      this.perfilForm.enable();
      // Email no editable por seguridad
      this.perfilForm.get('email')?.disable();
    } else {
      this.perfilForm.disable();
      this.cargarPerfil(); // Restaurar valores originales
    }
  }

  guardarCambios(): void {
    if (this.perfilForm.invalid) {
      Swal.fire('Error', 'Por favor complete todos los campos correctamente', 'error');
      return;
    }

    const userId = this.authService.getCurrentUserId();
    if (!userId) return;

    this.cargando = true;
    const formData = {
      nombres: this.perfilForm.get('nombres')?.value,
      apellidos: this.perfilForm.get('apellidos')?.value,
      telefono: this.perfilForm.get('telefono')?.value,
      documento: this.perfilForm.get('documento')?.value,
      tipoDocumento: this.perfilForm.get('tipoDocumento')?.value
    };

    this.userService.updateUser(userId, formData).subscribe({
      next: (response) => {
        Swal.fire('Éxito', 'Perfil actualizado correctamente', 'success');
        this.editando = false;
        this.perfilForm.disable();
        this.cargarPerfil();
      },
      error: (error) => {
        console.error('Error al actualizar perfil:', error);
        Swal.fire('Error', error.error?.message || 'No se pudo actualizar el perfil', 'error');
        this.cargando = false;
      }
    });
  }

  toggleCambiarPassword(): void {
    this.cambiandoPassword = !this.cambiandoPassword;
    if (!this.cambiandoPassword) {
      this.passwordForm.reset();
    }
  }

  cambiarPassword(): void {
    if (this.passwordForm.invalid) {
      Swal.fire('Error', 'Por favor complete todos los campos correctamente', 'error');
      return;
    }

    const userId = this.authService.getCurrentUserId();
    if (!userId) return;

    this.cargando = true;
    const passwordData = {
      currentPassword: this.passwordForm.get('currentPassword')?.value,
      newPassword: this.passwordForm.get('newPassword')?.value
    };

    this.userService.changePassword(userId, passwordData).subscribe({
      next: (response) => {
        Swal.fire('Éxito', 'Contraseña actualizada correctamente', 'success');
        this.cambiandoPassword = false;
        this.passwordForm.reset();
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al cambiar contraseña:', error);
        Swal.fire('Error', error.error?.message || 'No se pudo cambiar la contraseña', 'error');
        this.cargando = false;
      }
    });
  }

  getErrorMessage(formGroup: FormGroup, field: string): string {
    const control = formGroup.get(field);

    if (control?.hasError('required')) {
      return 'Este campo es requerido';
    }

    if (control?.hasError('email')) {
      return 'Email inválido';
    }

    if (control?.hasError('minlength')) {
      const minLength = control.errors?.['minlength'].requiredLength;
      return `Mínimo ${minLength} caracteres`;
    }

    if (control?.hasError('pattern')) {
      return 'Formato inválido';
    }

    if (control?.hasError('passwordMismatch')) {
      return 'Las contraseñas no coinciden';
    }

    return '';
  }
}
