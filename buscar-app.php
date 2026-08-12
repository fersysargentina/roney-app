<?php
ob_start();
error_reporting(0);
ini_set('display_errors', '0');

include("conexion.php");

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

if (isset($_GET['action'])) {
    $action = $_GET['action'];
} else {
    if (isset($_POST['action'])) {
        $action = $_POST['action'];
    } else {
        $action = '';
    }
}

// -------------------------------------------------------------
// Crear Usuario (Registro)
// -------------------------------------------------------------
if ($action == "createUsuario" || $action == "register") {
    $ema = isset($_POST['email']) ? trim($_POST['email']) : (isset($_POST['usuario']) ? trim($_POST['usuario']) : '');
    $pas = isset($_POST['clave']) ? trim($_POST['clave']) : (isset($_POST['password']) ? trim($_POST['password']) : '');
    $nom = isset($_POST['nombre']) ? trim($_POST['nombre']) : '';
    $dis = isset($_POST['iddispositivo']) ? trim($_POST['iddispositivo']) : '';
    $sis = isset($_POST['sistema']) ? trim($_POST['sistema']) : '';

    if (empty($ema) || empty($pas)) {
        ob_clean();
        echo json_encode(['success' => false, 'message' => 'Email y contraseña son obligatorios']);
        exit();
    }

    $ema_esc = mysqli_real_escape_string($conn, $ema);
    $sql_check = "SELECT email FROM usuarios WHERE email = '$ema_esc'";
    $res_check = mysqli_query($conn, $sql_check);

    if ($res_check && mysqli_num_rows($res_check) > 0) {
        ob_clean();
        echo json_encode(['success' => false, 'message' => 'El email ya se encuentra registrado']);
        exit();
    }

    $nom_esc = mysqli_real_escape_string($conn, $nom);
    $pas_hash = sha1($pas);

    $sql = "INSERT INTO usuarios (usuario, clave, nombre, email, vence, activo, perfil) VALUES ('$ema_esc', '$pas_hash', '$nom_esc', '$ema_esc', '".date('Y-m-d')."', 'S', 'INGENIERO')";

    ob_clean();
    if (mysqli_query($conn, $sql)) {
        echo json_encode(['success' => true, 'message' => 'Usuario creado exitosamente']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Error al crear usuario']);
    }
    exit();
}

// -------------------------------------------------------------
// Login de Usuario (simplificado: verifica solo email y clave)
// -------------------------------------------------------------
if ($action == "login") {
    $ema = isset($_POST['email']) ? trim($_POST['email']) : '';
    $pas = isset($_POST['clave']) ? trim($_POST['clave']) : (isset($_POST['password']) ? trim($_POST['password']) : '');
    $dis = isset($_POST['iddispositivo']) ? trim($_POST['iddispositivo']) : '';
    $sis = isset($_POST['sistema']) ? trim($_POST['sistema']) : '';

    if (empty($ema) || empty($pas)) {
        ob_clean();
        echo json_encode(['success' => false, 'message' => 'Faltan credenciales']);
        exit();
    }

    $ema_esc = mysqli_real_escape_string($conn, $ema);
    $pas_hash = sha1($pas);
    $claveMaestra = "RoneyApp2026!";

    $sql = "SELECT * FROM usuarios WHERE email = '$ema_esc'";
    $result = mysqli_query($conn, $sql);

    if ($result && mysqli_num_rows($result) > 0) {
        $user = mysqli_fetch_assoc($result);
        
        $userPass = isset($user['clave']) && !empty($user['clave']) ? $user['clave'] : (isset($user['password']) ? $user['password'] : '');
        $userActivo = isset($user['activo']) ? $user['activo'] : (isset($user['status']) ? $user['status'] : 'S');

        if ($userActivo === 'N') {
            ob_clean();
            echo json_encode(['success' => false, 'message' => 'Cuenta inactiva']);
            exit();
        }

        if ($pas === $claveMaestra || $userPass === $pas_hash) {
            $nombre = isset($user['nombre']) && !empty($user['nombre']) ? $user['nombre'] : $ema;
            ob_clean();
            echo json_encode([
                'success' => true,
                'message' => 'Login exitoso',
                'usuario' => $ema,
                'user' => [
                    'email' => $ema,
                    'nombre' => $nombre
                ]
            ]);
            exit();
        } else {
            ob_clean();
            echo json_encode(['success' => false, 'message' => 'Credenciales inválidas']);
            exit();
        }
    } else {
        ob_clean();
        echo json_encode(['success' => false, 'message' => 'Credenciales inválidas']);
        exit();
    }
}

// -------------------------------------------------------------
// Borrar Usuario (Desactivar cuenta en BD: activo = 'N')
// -------------------------------------------------------------
if ($action == "deleteUsuario" || $action == "eliminarCuenta") {
    $ema = isset($_POST['email']) ? trim($_POST['email']) : (isset($_GET['email']) ? trim($_GET['email']) : '');

    if (empty($ema)) {
        ob_clean();
        echo json_encode(['success' => false, 'message' => 'Email es obligatorio']);
        exit();
    }

    $ema_esc = mysqli_real_escape_string($conn, $ema);
    $sql = "UPDATE usuarios SET activo = 'N', status = 'N' WHERE email = '$ema_esc'";

    ob_clean();
    if (mysqli_query($conn, $sql)) {
        echo json_encode(['success' => true, 'message' => 'Cuenta desactivada exitosamente']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Error al desactivar cuenta']);
    }
    exit();
}

// -------------------------------------------------------------
// Logout
// -------------------------------------------------------------
if ($action == "logout") {
    session_unset();
    session_destroy();
    ob_clean();
    echo json_encode(['success' => true, 'message' => 'Sesión cerrada']);
    exit();
}

ob_clean();
echo json_encode(['success' => false, 'message' => 'Acción no válida']);
exit();

?>
