import { ClientService } from 'src/app/services/client.service';
import { Component, OnInit } from '@angular/core';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-parametres',
  templateUrl: './parametres.component.html',
  styleUrls: ['./parametres.component.css']
})
export class ParametresComponent implements OnInit {

  // ================= SYNC =================
  isLoading = false;
  syncMessage: { type: 'success' | 'error'; text: string } | null = null;

  // ================= CONFIG =================
  dolibarrUrl: string = '';
  dolibarrApiKey: string = '';
  isConfigLoading = false;
  showApiKey = false;

  message: { type: 'success' | 'error'; text: string } | null = null;

  // ================= ROLES =================
  roles: any[] = [];
  rolesLoading = false;

  currentRoleName = '';
  currentRoleDescription = '';
  editingRoleId: number | null = null;

  roleMessage: { type: 'success' | 'error'; text: string } | null = null;

  searchRoleTerm: string = '';
  filteredRoles: any[] = [];

  currentPage: number = 1;
  pageSize: number = 3;
  totalPages: number = 1;

  constructor(private clientservice: ClientService) {}

  ngOnInit(): void {
    this.loadRoles();
    this.loadDolibarrConfig();
  }

  // ================= SYNC =================
  syncAll() {
    this.isLoading = true;

    this.clientservice.syncAll().subscribe({
      next: (res) => {
        this.isLoading = false;

        this.syncMessage = {
          type: 'success',
          text: `Clients: ${res.clients.count} | Factures: ${res.invoices.count}`
        };

        setTimeout(() => this.syncMessage = null, 5000);
      },
      error: (err) => {
        this.isLoading = false;

        this.syncMessage = {
          type: 'error',
          text: err.error?.detail || err.message
        };
      }
    });
  }

  // ================= CONFIG =================
  loadDolibarrConfig() {
    this.clientservice.getDolibarrConfig().subscribe({
      next: (res) => {
        this.dolibarrUrl = res.url;
        this.dolibarrApiKey = res.api_key;
      },
      error: () => {
        this.message = {
          type: 'error',
          text: 'Impossible de charger la configuration'
        };
      }
    });
  }

  saveConfig() {
    if (!this.dolibarrUrl || !this.dolibarrApiKey) {
      this.message = {
        type: 'error',
        text: 'URL et API Key obligatoires'
      };
      return;
    }

    this.isConfigLoading = true;

    this.clientservice.saveDolibarrConfig({
      url: this.dolibarrUrl,
      apiKey: this.dolibarrApiKey
    }).subscribe({
      next: () => {
        this.isConfigLoading = false;

        this.message = {
          type: 'success',
          text: 'Configuration mise à jour avec succès'
        };
      },
      error: (err) => {
        this.isConfigLoading = false;

        this.message = {
          type: 'error',
          text: err.error?.detail || 'Erreur sauvegarde'
        };
      }
    });
  }

  // ================= RESET =================
  resetDatabase() {
    Swal.fire({
      title: 'Reset base locale ?',
      text: 'Tous les clients et factures seront supprimés',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Oui',
      cancelButtonText: 'Annuler'
    }).then((result) => {
      if (result.isConfirmed) {
        this.clientservice.resetDatabase().subscribe({
          next: () => Swal.fire('Succès', 'Base vidée', 'success'),
          error: () => Swal.fire('Erreur', 'Impossible de reset', 'error')
        });
      }
    });
  }

  // ================= ROLES =================
  loadRoles() {
    this.rolesLoading = true;

    this.clientservice.getRoles().subscribe({
      next: (data) => {
        this.roles = data || [];
        this.filterRoles();
        this.rolesLoading = false;
      },
      error: () => {
        this.rolesLoading = false;
        this.roleMessage = { type: 'error', text: 'Erreur chargement rôles' };
      }
    });
  }

  saveRole() {
    if (!this.currentRoleName.trim()) return;

    const roleData = {
      name: this.currentRoleName,
      description: this.currentRoleDescription
    };

    if (this.editingRoleId) {
      this.clientservice.updateRole(this.editingRoleId, roleData).subscribe({
        next: () => {
          this.roleMessage = { type: 'success', text: 'Rôle mis à jour' };
          this.resetRoleForm();
          this.loadRoles();
        },
        error: () => {
          this.roleMessage = { type: 'error', text: 'Erreur update rôle' };
        }
      });
    } else {
      this.clientservice.addRole(roleData).subscribe({
        next: () => {
          this.roleMessage = { type: 'success', text: 'Rôle ajouté' };
          this.resetRoleForm();
          this.loadRoles();
        },
        error: () => {
          this.roleMessage = { type: 'error', text: 'Erreur ajout rôle' };
        }
      });
    }
  }

  editRole(role: any) {
    this.currentRoleName = role.name;
    this.currentRoleDescription = role.description;
    this.editingRoleId = role.id;
  }

  cancelEdit() {
    this.resetRoleForm();
  }

  deleteRole(id: number) {
    Swal.fire({
      title: 'Supprimer ce rôle ?',
      icon: 'warning',
      showCancelButton: true
    }).then(result => {
      if (result.isConfirmed) {
        this.clientservice.deleteRole(id).subscribe({
          next: () => this.loadRoles(),
          error: () => Swal.fire('Erreur', 'Suppression impossible', 'error')
        });
      }
    });
  }

  resetRoleForm() {
    this.currentRoleName = '';
    this.currentRoleDescription = '';
    this.editingRoleId = null;
  }

  // ================= FILTER =================
  filterRoles() {
    const term = this.searchRoleTerm.toLowerCase();

    this.filteredRoles = this.roles.filter(r =>
      r.name?.toLowerCase().includes(term) ||
      r.description?.toLowerCase().includes(term)
    );

    this.updatePagination();
  }

  updatePagination() {
    this.totalPages = Math.max(1, Math.ceil(this.filteredRoles.length / this.pageSize));
  }

  get paginatedRoles() {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredRoles.slice(start, start + this.pageSize);
  }

  changePage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }
}
